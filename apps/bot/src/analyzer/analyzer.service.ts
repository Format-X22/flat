import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel } from '../data/candle.model';
import { Between, Repository } from 'typeorm';
import { TActualOrder } from './detector/detector.dto';
import { days, hours, millis, startOfYear } from '../utils/time.util';
import { TCalcArgs } from './analyzer.dto';
import { config } from '../bot.config';
import { SegmentUtil } from './wave/segment.util';
import { DetectorExecutor } from './detector/detector.executor';

@Injectable()
export class AnalyzerService {
    private from: number = startOfYear(2018);
    private to: number = Number.MAX_SAFE_INTEGER;

    constructor(@InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>) {}

    async calc({ risk, isSilent, from, to }: TCalcArgs): Promise<TActualOrder> {
        const segmentUtil = new SegmentUtil();
        const detectorExecutor = new DetectorExecutor(segmentUtil);

        if (typeof from === 'number') {
            this.from = from;
        }

        if (typeof to === 'number') {
            this.to = to;
        }

        const candles = await this.getCandles();

        for (const candle of candles) {
            const offset = days(1) - millis(1);
            const innerCandles = await this.getInnerCandles(
                candle.timestamp + hours(8),
                candle.timestamp + hours(8) + offset,
            );

            segmentUtil.addCandle(candle, innerCandles);

            if (!this.isInTestRange(candle)) {
                continue;
            }

            detectorExecutor.detect(isSilent, risk);
        }

        if (!isSilent) {
            detectorExecutor.printCapital();
            detectorExecutor.printLastOrders();
        }

        return detectorExecutor.getOrders();
    }

    private async getCandles(): Promise<Array<CandleModel>> {
        return this.candleRepo.find({
            where: { size: '1d', ticker: config.ticker },
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
