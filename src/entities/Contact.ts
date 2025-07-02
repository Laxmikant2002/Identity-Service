import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';

export enum LinkPrecedence {
    PRIMARY = 'primary',
    SECONDARY = 'secondary'
}

@Entity()
@Index(['email'])
@Index(['phoneNumber'])
export class Contact {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: true, type: 'varchar', length: 255 })
    phoneNumber?: string;

    @Column({ nullable: true, type: 'varchar', length: 255 })
    email?: string;

    @Column({ nullable: true })
    linkedId?: number;

    @Column({
        type: 'varchar',
        length: 50,
        default: LinkPrecedence.PRIMARY
    })
    linkPrecedence!: LinkPrecedence;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}