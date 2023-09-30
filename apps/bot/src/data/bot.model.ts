import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum EStock {
    TEST = 'TEST',
    BINANCE = 'BINANCE',
    BYBIT = 'BYBIT',
}

export enum EPair {
    TEST = 'TEST',
    BTCUSDT = 'BTCUSDT',
}

export enum EState {
    INITIAL = 'INITIAL',
    // TODO -
}

@Entity()
export class BotModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    isActive: boolean;

    @Column()
    stock: EStock;

    @Column()
    pair: EPair;

    @Column()
    coldPercent: number;

    @Column()
    apiKey: string;

    @Column()
    payAmount: number;

    @Column()
    state: EState;
}
