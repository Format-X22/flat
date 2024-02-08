import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel } from './data/candle.model';
import { Between, MoreThan, Repository } from 'typeorm';
import { ESize, ETicker } from './bot.types';
import { days, startOfYear } from './utils/time.util';

class WeekState {
    public candle: CandleModel;
    public innerCandles: Array<CandleModel>;
    public isUpDetect: boolean;
    public isUpPosition: boolean;
    public enterPrice: number;
    public takePrice: number;
    public stopPrice: number;
    public inPosition: boolean = false;
    public inZero: boolean = false;
    public isSafeZero: boolean;
    public capital: number = 100;
    public profits: number = 0;
    public zeros: number = 0;
    public fails: number = 0;

    resetToNext() {
        this.candle = null;
        this.innerCandles = null;
        this.isUpDetect = null;
        this.isUpPosition = null;
        this.enterPrice = null;
        this.takePrice = null;
        this.stopPrice = null;
        this.inPosition = false;
        this.inZero = false;
        this.isSafeZero = null;
    }
}

const START_HOUR = 10;
const STOP_OFFSET = 2.5;
const TAKE_OFFSET = 2.5;
const FEES_OFFSET = 0.5;
const ZERO_HOURS = 6 * 24;
const RISK = 10;

const RISK_MUL = RISK / (STOP_OFFSET + FEES_OFFSET / 2);

@Injectable()
export class Week {
    private logger: Logger = new Logger(Week.name);

    constructor(@InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>) {}

    async start(): Promise<void> {
        const candles = await this.getCandles();
        const state = new WeekState();

        for (let i = 2; i < candles.length; i++) {
            const prev2 = candles[i - 2];
            const prev = candles[i - 1];
            const candle = candles[i];

            state.candle = candle;
            state.innerCandles = await this.getInnerCandles(candle.timestamp, candle.timestamp + days(7) - 1);
            state.isUpDetect = prev2.bigHma < prev.bigHma;

            this.calc(state);
        }

        this.logger.log(
            `\n\nRESULT: P: ${state.profits} Z: ${state.zeros} F: ${state.fails} - PROFIT=${state.capital.toFixed(2)}`,
        );
    }

    private async getCandles(): Promise<Array<CandleModel>> {
        return this.candleRepo.find({
            where: { size: ESize.WEEK, ticker: ETicker.BTCUSDT, timestamp: MoreThan(startOfYear(2019) - days(14)) },
            order: { timestamp: 'ASC' },
        });
    }

    private async getInnerCandles(from: number, to: number): Promise<Array<CandleModel>> {
        return this.candleRepo.find({
            where: { size: '1h', timestamp: Between(from, to), ticker: ETicker.BTCUSDT },
            order: { timestamp: 'ASC' },
        });
    }

    private calc(state: WeekState): void {
        const alreadyInPosition = state.inPosition;
        let index: number = START_HOUR;

        //this.logger.log(state.candle.dateString);

        if (alreadyInPosition) {
            index = 0;
            //this.logger.verbose('Pass week ' + state.candle.dateString);
        } else {
            let moveMul;

            if (state.isUpDetect) {
                moveMul = 1;
                state.isUpPosition = true;
            } else {
                moveMul = -1;
                state.isUpPosition = false;
            }

            state.inPosition = false;
            state.enterPrice = state.candle.open;
            state.stopPrice = state.candle.open * ((100 - STOP_OFFSET * moveMul) / 100);
            state.takePrice = state.candle.open * ((100 + TAKE_OFFSET * moveMul) / 100);
        }

        for (; index < state.innerCandles.length; index++) {
            const candle = state.innerCandles[index];

            if (state.inPosition) {
                if (!alreadyInPosition && index === ZERO_HOURS && !state.inZero) {
                    state.inZero = true;

                    if (state.isUpPosition) {
                        if (state.enterPrice < candle.open) {
                            state.stopPrice = state.enterPrice;
                            state.isSafeZero = true;
                        } else {
                            state.takePrice = state.enterPrice;
                            state.isSafeZero = false;
                        }
                    } else {
                        if (state.enterPrice > candle.open) {
                            state.stopPrice = state.enterPrice;
                            state.isSafeZero = true;
                        } else {
                            state.takePrice = state.enterPrice;
                            state.isSafeZero = false;
                        }
                    }
                }

                if (state.isUpPosition) {
                    if (candle.low <= state.stopPrice) {
                        if (state.inZero && state.isSafeZero) {
                            this.calcZero(state, candle);
                        } else {
                            this.calcFail(state, candle);
                        }
                        break;
                    } else if (candle.high > state.takePrice) {
                        if (state.inZero && !state.isSafeZero) {
                            this.calcZero(state, candle);
                        } else {
                            this.calcProfit(state, candle);
                        }
                        break;
                    }
                } else {
                    if (candle.high >= state.stopPrice) {
                        if (state.inZero && state.isSafeZero) {
                            this.calcZero(state, candle);
                        } else {
                            this.calcFail(state, candle);
                        }
                        break;
                    } else if (candle.low < state.takePrice) {
                        if (state.inZero && !state.isSafeZero) {
                            this.calcZero(state, candle);
                        } else {
                            this.calcProfit(state, candle);
                        }
                        break;
                    }
                }
            } else if (index < ZERO_HOURS) {
                if (state.isUpPosition) {
                    if (candle.open < state.enterPrice) {
                        if (candle.high >= state.enterPrice) {
                            state.inPosition = true;
                            //this.logger.warn('In ' + (state.isUpPosition ? 'UP ' : 'DOWN ') + candle.dateString);
                            index--;
                        }
                    } else {
                        if (candle.low <= state.enterPrice) {
                            state.inPosition = true;
                            //this.logger.warn('In ' + (state.isUpPosition ? 'UP ' : 'DOWN ') + candle.dateString);
                            index--;
                        }
                    }
                } else {
                    if (candle.open > state.enterPrice) {
                        if (candle.low <= state.enterPrice) {
                            state.inPosition = true;
                            //this.logger.warn('In ' + (state.isUpPosition ? 'UP ' : 'DOWN ') + candle.dateString);
                            index--;
                        }
                    } else {
                        if (candle.high >= state.enterPrice) {
                            state.inPosition = true;
                            //this.logger.warn('In ' + (state.isUpPosition ? 'UP ' : 'DOWN ') + candle.dateString);
                            index--;
                        }
                    }
                }
            }
        }
    }

    private calcProfit(state: WeekState, candle: CandleModel): void {
        this.logger.verbose('PROFIT ' + candle.dateString);

        state.profits++;
        state.capital *= ((TAKE_OFFSET - FEES_OFFSET) * RISK_MUL) / 100 + 1;

        state.resetToNext();
    }

    private calcZero(state: WeekState, candle: CandleModel): void {
        this.logger.verbose('ZERO ' + candle.dateString);

        state.zeros++;
        state.capital *= (-FEES_OFFSET * RISK_MUL) / 100 + 1;

        state.resetToNext();
    }

    private calcFail(state: WeekState, candle: CandleModel): void {
        this.logger.verbose('FAIL ' + candle.dateString);

        state.fails++;
        state.capital *= (100 - RISK) / 100;

        state.resetToNext();
    }
}
