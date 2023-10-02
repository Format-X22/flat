import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type TFullState = `${EStateSection}__${EState}`;

export enum EStock {
    TEST = 'TEST',
    BINANCE = 'BINANCE',
    BYBIT = 'BYBIT',
}

export enum EPair {
    TEST = 'TEST',
    BTCUSDT = 'BTCUSDT',
}

export enum EStateSection {
    INITIAL = 'INITIAL',
    ERROR = 'ERROR',
    WORKING = 'WORKING',
    HANDLE_CANDLE = 'HANDLE_CANDLE',
}

export enum EState {
    // INITIAL
    INITIAL = 'INITIAL',
    DEACTIVATED = 'DEACTIVATED',

    // ERROR
    ERROR = 'ERROR',
    EMERGENCY_STOP = 'EMERGENCY_STOP',

    // WORKING
    WAITING = 'WAITING',
    CHECK_POSITION_COLLISION = 'CHECK_POSITION_COLLISION',
    CHECK_BALANCE_CHANGE = 'CHECK_BALANCE_CHANGE',
    CHECK_PAYMENT_REQUIRES = 'CHECK_PAYMENT_REQUIRES',

    // HANDLE_CANDLE
    CHECK_ANALYTICS = 'CHECK_ANALYTICS',
    CHECK_POSITION_WRONG_EXISTS = 'CHECK_WRONG_POSITION_EXISTS',
    CANCEL_UP_ORDER = 'CANCEL_UP_ORDER',
    CANCEL_DOWN_ORDER = 'CANCEL_DOWN_ORDER',
    PLACE_UP_ORDER = 'PLACE_UP_ORDER',
    PLACE_DOWN_ORDER = 'PLACE_DOWN_ORDER',
    REPLACE_STOP = 'REPLACE_STOP',
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
    stateSection: EStateSection;

    @Column()
    state: EState;

    @Column()
    errorOnState: `${EStateSection}__${EState}`;

    @Column()
    errorMessage: string;

    @Column({ nullable: true })
    owner: string;

    @Column({ nullable: true })
    comment: string;
}
