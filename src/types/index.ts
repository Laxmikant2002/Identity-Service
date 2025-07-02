import { Contact } from "../entities/Contact";

export interface IdentifyRequest {
    email?: string;
    phoneNumber?: string;
}

export interface IdentifyResponse {
    contact: {
        primaryContactId: number;
        emails: string[];
        phoneNumbers: string[];
        secondaryContactIds: number[];        
    };
}

export interface ContactGroup {
    primary: Contact;
    secondaries: Contact[];
    allContacts: Contact[];
}