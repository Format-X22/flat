import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel } from '../../data/candle.model';
import { Between, Repository } from 'typeorm';
import { SegmentService } from '../segment/segment.service';
import { DetectorService } from '../detector/detector.service';
import { TActualOrder } from '../detector/detector.dto';
import { days, startOfYear } from '../../utils/time.util';
import { TCalcArgs } from './calculator.dto';
import { config } from '../../bot.config';
import { ESize } from '../../bot.types';

@Injectable()
export class CalculatorService {
    private from: number = startOfYear(2018);
    private to: number = Number.MAX_SAFE_INTEGER;

    constructor(
        @InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>,
        private readonly segmentService: SegmentService,
        private readonly detectorService: DetectorService,
    ) {}

    async calc({ risk, isSilent, from, to }: TCalcArgs): Promise<TActualOrder> {
        if (typeof from === 'number') {
            this.from = from;
        }

        if (typeof to === 'number') {
            this.to = to;
        }

        const candles = await this.getCandles();

        for (const candle of candles) {
            let offset;

            switch (config.size) {
                case ESize.DAY:
                    offset = days(1);
                    break;
                case ESize.WEEK:
                    offset = days(7);
                    break;
                default:
                    throw new Error('INVALID SIZE');
            }

            const innerCandles = await this.getInnerCandles(candle.timestamp, candle.timestamp + offset - 1);

            this.segmentService.addCandle(candle, innerCandles);

            if (!this.isInTestRange(candle)) {
                continue;
            }

            this.detectorService.detect(isSilent, risk);
        }

        if (!isSilent) {
            this.detectorService.printCapital();
            this.detectorService.printLastOrders();
        }

        return this.detectorService.getOrders();
    }

    private async getCandles(): Promise<Array<CandleModel>> {
        return this.candleRepo.find({
            where: { size: config.size, ticker: config.ticker },
            order: { timestamp: 'ASC' },
        });
    }

    private async getInnerCandles(from: number, to: number): Promise<Array<CandleModel>> {
        return this.candleRepo.find({
            where: { size: '1h', timestamp: Between(from, to), ticker: config.ticker },
            order: { timestamp: 'ASC' },
        });
    }

    private isInTestRange(candle: CandleModel): boolean {
        return candle.timestamp > this.from && candle.timestamp < this.to;
    }
}
