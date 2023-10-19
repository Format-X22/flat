import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BotModel } from './bot.model';

export enum ELogType {
    ALL = 'ALL',
    VERBOSE = 'VERBOSE',
    ERROR = 'ERROR',
    TECH = 'TECH',
    TRADE = 'TRADE',
}

@Entity()
export class BotLogModel {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => BotModel, (bot) => bot.logs)
    bot: BotModel;

    @Column()
    type: ELogType;

    @Column()
    message: string;

    @Column()
    date: Date;
}
