import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Contact, LinkPrecedence } from '../entities/Contact';
import { IdentifyRequest, IdentifyResponse, ContactGroup } from '../types';

export class IdentityService {
    private contactRepository: Repository<Contact>;

    constructor() {
        this.contactRepository = AppDataSource.getRepository(Contact);
    }

    async identify(request: IdentifyRequest): Promise<IdentifyResponse> {
        const { email, phoneNumber } = request;

        // Find existing contacts that match email or phone
        const existingContacts = await this.findMatchingContacts(email, phoneNumber);

        if (existingContacts.length === 0) {
            // No existing contacts, create new primary contact
            const newContact = await this.createNewContact(email, phoneNumber, LinkPrecedence.PRIMARY);
            return this.formatResponse([newContact]);
        }

        // Group contacts by their primary contact
        const contactGroups = await this.groupContactsByPrimary(existingContacts);

        if (contactGroups.length === 1) {
            // All contacts belong to same identity group
            const group = contactGroups[0];
            const exactMatch = this.findExactMatch(group.allContacts, email, phoneNumber);

            if (exactMatch) {
                // Exact match found, return existing identity
                return this.formatResponse(group.allContacts);
            } else {
                // New information for existing identity, create secondary contact
                const newSecondary = await this.createNewContact(
                    email, 
                    phoneNumber, 
                    LinkPrecedence.SECONDARY, 
                    group.primary.id
                );
                return this.formatResponse([...group.allContacts, newSecondary]);
            }
        } else {
            // Multiple identity groups found, need to merge
            const mergedContacts = await this.mergeContactGroups(contactGroups, email, phoneNumber);
            return this.formatResponse(mergedContacts);
        }
    }

    private async findMatchingContacts(email?: string, phoneNumber?: string): Promise<Contact[]> {
        const query = this.contactRepository.createQueryBuilder('contact')
            .where('contact.deletedAt IS NULL');

        if (email && phoneNumber) {
            query.andWhere('(contact.email = :email OR contact.phoneNumber = :phoneNumber)', 
                { email, phoneNumber });
        } else if (email) {
            query.andWhere('contact.email = :email', { email });
        } else if (phoneNumber) {
            query.andWhere('contact.phoneNumber = :phoneNumber', { phoneNumber });
        }

        return query.getMany();
    }

    private async groupContactsByPrimary(contacts: Contact[]): Promise<ContactGroup[]> {
        const primaryIds = new Set<number>();
        const contactMap = new Map<number, Contact[]>();

        // Find all primary contact IDs
        for (const contact of contacts) {
            const primaryId = await this.findPrimaryContactId(contact);
            primaryIds.add(primaryId);
            
            if (!contactMap.has(primaryId)) {
                contactMap.set(primaryId, []);
            }
        }

        // Group all contacts under their primary
        const groups: ContactGroup[] = [];
        for (const primaryId of primaryIds) {
            const allGroupContacts = await this.getAllContactsInGroup(primaryId);
            const primary = allGroupContacts.find(c => c.linkPrecedence === LinkPrecedence.PRIMARY)!;
            const secondaries = allGroupContacts.filter(c => c.linkPrecedence === LinkPrecedence.SECONDARY);

            groups.push({
                primary,
                secondaries,
                allContacts: allGroupContacts
            });
        }

        return groups;
    }

    private async findPrimaryContactId(contact: Contact): Promise<number> {
        if (contact.linkPrecedence === LinkPrecedence.PRIMARY) {
            return contact.id;
        }
        
        if (contact.linkedId) {
            const linkedContact = await this.contactRepository.findOne({ 
                where: { id: contact.linkedId } 
            });
            if (linkedContact) {
                return await this.findPrimaryContactId(linkedContact);
            }
        }
        
        return contact.id;
    }

    private async getAllContactsInGroup(primaryId: number): Promise<Contact[]> {
        // Get primary contact
        const primary = await this.contactRepository.findOne({ 
            where: { id: primaryId, linkPrecedence: LinkPrecedence.PRIMARY } 
        });
        
        if (!primary) {
            throw new Error(`Primary contact with ID ${primaryId} not found`);
        }

        // Get all secondary contacts linked to this primary
        const secondaries = await this.contactRepository.find({
            where: { linkedId: primaryId, linkPrecedence: LinkPrecedence.SECONDARY }
        });

        return [primary, ...secondaries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    private findExactMatch(contacts: Contact[], email?: string, phoneNumber?: string): boolean {
        return contacts.some(contact => 
            contact.email === email && contact.phoneNumber === phoneNumber
        );
    }

    private async createNewContact(
        email?: string, 
        phoneNumber?: string, 
        linkPrecedence: LinkPrecedence = LinkPrecedence.PRIMARY,
        linkedId?: number
    ): Promise<Contact> {
        const contact = this.contactRepository.create({
            email,
            phoneNumber,
            linkPrecedence,
            linkedId
        });

        return await this.contactRepository.save(contact);
    }

    private async mergeContactGroups(
        groups: ContactGroup[], 
        email?: string, 
        phoneNumber?: string
    ): Promise<Contact[]> {
        // Find the oldest primary contact
        const oldestPrimary = groups
            .map(g => g.primary)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

        const allContacts: Contact[] = [];
        let needsNewSecondary = true;

        // Update all other primaries to become secondaries
        for (const group of groups) {
            if (group.primary.id === oldestPrimary.id) {
                // This is the group with the oldest primary
                allContacts.push(...group.allContacts);
                
                // Check if we need to create a new secondary
                if (this.findExactMatch(group.allContacts, email, phoneNumber)) {
                    needsNewSecondary = false;
                }
            } else {
                // Convert this primary to secondary
                group.primary.linkPrecedence = LinkPrecedence.SECONDARY;
                group.primary.linkedId = oldestPrimary.id;
                await this.contactRepository.save(group.primary);

                // Update all secondaries to point to the oldest primary
                for (const secondary of group.secondaries) {
                    secondary.linkedId = oldestPrimary.id;
                    await this.contactRepository.save(secondary);
                }

                allContacts.push(group.primary, ...group.secondaries);
            }
        }

        // Create new secondary contact if needed
        if (needsNewSecondary) {
            const newSecondary = await this.createNewContact(
                email, 
                phoneNumber, 
                LinkPrecedence.SECONDARY, 
                oldestPrimary.id
            );
            allContacts.push(newSecondary);
        }

        return allContacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    private formatResponse(contacts: Contact[]): IdentifyResponse {
        const primary = contacts.find(c => c.linkPrecedence === LinkPrecedence.PRIMARY)!;
        const secondaries = contacts.filter(c => c.linkPrecedence === LinkPrecedence.SECONDARY);

        // Collect unique emails and phone numbers
        const emails = Array.from(new Set(
            contacts.map(c => c.email).filter(Boolean)
        )) as string[];

        const phoneNumbers = Array.from(new Set(
            contacts.map(c => c.phoneNumber).filter(Boolean)
        )) as string[];

        // Ensure primary contact's email and phone are first
        if (primary.email && !emails.includes(primary.email)) {
            emails.unshift(primary.email);
        } else if (primary.email) {
            const index = emails.indexOf(primary.email);
            if (index > 0) {
                emails.splice(index, 1);
                emails.unshift(primary.email);
            }
        }

        if (primary.phoneNumber && !phoneNumbers.includes(primary.phoneNumber)) {
            phoneNumbers.unshift(primary.phoneNumber);
        } else if (primary.phoneNumber) {
            const index = phoneNumbers.indexOf(primary.phoneNumber);
            if (index > 0) {
                phoneNumbers.splice(index, 1);
                phoneNumbers.unshift(primary.phoneNumber);
            }
        }

        return {
            contact: {
                primaryContactId: primary.id,
                emails,
                phoneNumbers,
                secondaryContactIds: secondaries.map(s => s.id)
            }
        };
    }
}