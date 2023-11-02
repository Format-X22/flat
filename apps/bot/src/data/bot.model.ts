import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { BotLogModel } from './bot-log.model';

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
    CANDLE_CHECK_ANALYTICS = 'CANDLE_CHECK_ANALYTICS',
    CANDLE_CHECK_POSITION_WRONG_EXISTS = 'CANDLE_CHECK_WRONG_POSITION_EXISTS',
    CANDLE_CANCEL_ORDERS = 'CANDLE_CANCEL_ORDERS',
    CANDLE_PLACE_ORDERS = 'CANDLE_PLACE_ORDERS',
    CANDLE_REPLACE_STOP = 'REPLACE_STOP',
}

@Entity()
export class BotModel {
    @PrimaryColumn()
    id: number;

    @Column()
    isActive: boolean;

    @Column()
    stock: EStock;

    @Column()
    pair: EPair;

    @Column({ select: false })
    apiKey: string;

    @Column()
    state: EState;

    @Column({ nullable: true })
    errorOnState: EState;

    @Column({ nullable: true })
    errorMessage: string;

    @Column('integer', { nullable: true })
    lastHandledCandle: number;

    @Column()
    owner: string;

    @Column('real', { nullable: true })
    lastBalance: number;

    @OneToMany(() => BotLogModel, (botLog) => botLog.bot)
    logs: Array<BotLogModel>;
}
