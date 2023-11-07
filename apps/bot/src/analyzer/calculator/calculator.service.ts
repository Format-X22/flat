import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel } from '../../data/candle.model';
import { Repository } from 'typeorm';
import { SegmentService } from '../segment/segment.service';
import { DetectorService } from '../detector/detector.service';
import { TActualOrder } from '../detector/detector.dto';
import { DateTime } from 'luxon';

@Injectable()
export class CalculatorService {
    private from: number = DateTime.fromObject({ year: 2018, month: 1, day: 1 }).toMillis();
    private to: number = Number.MAX_SAFE_INTEGER;

    constructor(
        @InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>,
        private readonly segmentService: SegmentService,
        private readonly detectorService: DetectorService,
    ) {}

    async calc(isSilent = false, from?: number, to?: number): Promise<TActualOrder> {
        if (typeof from === 'number') {
            this.from = from;
        }

        if (typeof to === 'number') {
            this.to = to;
        }

        const candles = await this.getCandles('1d');

        for (const candle of candles) {
            this.segmentService.addCandle(candle);

            if (!this.isInTestRange(candle)) {
                continue;
            }

            this.detectorService.detect(isSilent);
        }

        if (!isSilent) {
            this.detectorService.printCapital();
            this.detectorService.printLastOrders();
        }

        return this.detectorService.getOrders();
    }

    private async getCandles(size: string): Promise<Array<CandleModel>> {
        const candles = await this.candleRepo.find({ where: { size }, order: { timestamp: 'ASC' } });

        return JSON.parse(JSON.stringify(candles)).map((candle) => {
            candle.timestamp = +candle.timestamp;

            return candle;
        });
    }

    private isInTestRange(candle: CandleModel): boolean {
        return candle.timestamp > this.from && candle.timestamp < this.to;
    }
}
