import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel } from './data/candle.model';
import { Between, MoreThan, Repository } from 'typeorm';
import { ESize, ETicker } from './bot.types';
import { days, startOfYear } from './utils/time.util';

class WeekState {
    public candle: CandleModel;
    public innerCandles: Array<CandleModel>;
    public isUp: boolean;
    public enterPrice: number;
    public takePrice: number;
    public stopPrice: number;
    public inPosition: boolean = false;
}

const START_HOUR = 10;
const STOP_OFFSET = 2.5;
const TAKE_OFFSET = 10;
const ZERO_HOURS = 2 * 24;

@Injectable()
export class Week {
    constructor(@InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>) {}

    async start(): Promise<void> {
        const candles = await this.getCandles();
        const state = new WeekState();

        for (let i = 1; i < candles.length; i++) {
            const prev = candles[i - 1];
            const candle = candles[i];

            state.candle = candle;
            state.innerCandles = await this.getInnerCandles(candle.timestamp, candle.timestamp + days(7) - 1);
            state.isUp = prev.hma < candle.hma;

            this.calc(state);
        }
    }

    private async getCandles(): Promise<Array<CandleModel>> {
        return this.candleRepo.find({
            where: { size: ESize.WEEK, ticker: ETicker.BTCUSDT, timestamp: MoreThan(startOfYear(2019) - days(7)) },
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

        if (alreadyInPosition) {
            index = 0;
        } else {
            let moveMul = 1;

            if (!state.isUp) {
                moveMul = -1;
            }

            state.stopPrice = state.candle.open * ((100 - STOP_OFFSET * moveMul) / 100);
            state.takePrice = state.candle.open * ((100 + TAKE_OFFSET * moveMul) / 100);
        }

        for (; index < state.innerCandles.length; index++) {
            const candle = state.innerCandles[index];

            if (!alreadyInPosition && index === ZERO_HOURS) {
                // TODO To zero logic
            }

            // TODO Handle
        }
    }
}
