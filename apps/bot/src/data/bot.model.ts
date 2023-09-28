import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BotModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    isActive: boolean

    // TODO -
}
