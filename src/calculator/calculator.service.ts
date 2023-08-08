import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel } from '../loader/candle.model';
import { Repository } from 'typeorm';
import { TSegment } from './calculator.types';

@Injectable()
export class CalculatorService {
    private readonly logger: Logger = new Logger(CalculatorService.name);

    constructor(@InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>) {}

    async calc(): Promise<void> {
        const candles = await this.getCandles('1d');
        const segments = this.getSegments(candles);

        console.log(segments.slice(-10));

        // TODO -
    }

    private getCandles(size: string): Promise<Array<CandleModel>> {
        return this.candleRepo.find({ where: { size }, order: { timestamp: 'ASC' } });
    }

    private getSegments(candles: Array<CandleModel>): Array<TSegment> {
        const segments: Array<TSegment> = [];

        let currentSegment: TSegment = {
            isUp: null,
            size: 0,
            min: Infinity,
            max: -Infinity,
            startDate: null,
            endDate: null,
        };

        for (let i = 0; i < candles.length; i++) {
            const candle = candles[i];
            const prev1Candle = candles[i - 1];

            if (currentSegment.isUp === true) {
                if (prev1Candle && prev1Candle.hma > candle.hma) {
                    currentSegment.endDate = prev1Candle.dateString;
                    segments.push(currentSegment);
                    currentSegment = null;
                }
            } else if (currentSegment.isUp === false) {
                if (prev1Candle && prev1Candle.hma < candle.hma) {
                    currentSegment.endDate = prev1Candle.dateString;
                    segments.push(currentSegment);
                    currentSegment = null;
                }
            }

            if (!currentSegment) {
                currentSegment = {
                    isUp: null,
                    size: 0,
                    min: Infinity,
                    max: -Infinity,
                    startDate: candle.dateString,
                    endDate: null,
                };
            }

            if (currentSegment.min > candle.low) {
                currentSegment.min = candle.low;
            }

            if (currentSegment.max < candle.high) {
                currentSegment.max = candle.high;
            }

            if (prev1Candle && currentSegment.isUp === null) {
                currentSegment.isUp = prev1Candle.hma <= candle.hma;
            }

            if (!currentSegment.startDate) {
                currentSegment.startDate = candle.dateString;
            }

            currentSegment.size++;
        }

        segments.push(currentSegment);

        return segments;
    }
}
