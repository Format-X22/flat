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
    INITIAL_INITIAL = 'INITIAL_INITIAL',
    INITIAL_DEACTIVATED = 'INITIAL_DEACTIVATED',
    ERROR_ERROR = 'ERROR_ERROR',
    ERROR_EMERGENCY_STOP = 'ERROR_EMERGENCY_STOP',
    WORKING_WAITING = 'WORKING_WAITING',
    WORKING_DEACTIVATE = 'WORKING_DEACTIVATE',
    WORKING_CHECK_POSITION_COLLISION = 'WORKING_CHECK_POSITION_COLLISION',
    WORKING_CHECK_BALANCE_CHANGE = 'WORKING_CHECK_BALANCE_CHANGE',
    WORKING_CHECK_PAYMENT_REQUIRES = 'WORKING_CHECK_PAYMENT_REQUIRES',
    CANDLE_CHECK_ANALYTICS = 'CANDLE_CHECK_ANALYTICS',
    CANDLE_CHECK_POSITION_WRONG_EXISTS = 'CANDLE_CHECK_WRONG_POSITION_EXISTS',
    CANDLE_CANCEL_ORDERS = 'CANDLE_CANCEL_ORDERS',
    CANDLE_PLACE_ORDERS = 'CANDLE_PLACE_ORDERS',
    CANDLE_REPLACE_STOP = 'REPLACE_STOP',
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

    @Column()
    errorOnState: EState;

    @Column()
    errorMessage: string;

    @Column('timestamp')
    lastHandledCandle: number;

    @Column({ nullable: true })
    owner: string;

    @Column({ nullable: true })
    comment: string;
}
