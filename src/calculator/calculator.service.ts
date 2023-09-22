import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel } from '../loader/candle.model';
import { Repository } from 'typeorm';
import { SegmentService } from '../segment/segment.service';
import { DetectorService } from '../detector/detector.service';
import { DateTime } from 'luxon';

@Injectable()
export class CalculatorService {
    private readonly logger: Logger = new Logger(CalculatorService.name);

    constructor(
        @InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>,
        private readonly segmentService: SegmentService,
        private readonly detectorService: DetectorService,
    ) {}

    async calc(): Promise<void> {
        const candles = await this.getCandles('1d');

        for (const candle of candles) {
            this.segmentService.addCandle(candle);

            if (!this.isInTestRange(candle)) {
                continue;
            }

            this.detectorService.detect();
        }

        this.detectorService.printCapital();
        this.detectorService.printLastOrders();
    }

    private async getCandles(size: string): Promise<Array<CandleModel>> {
        const candles = await this.candleRepo.find({ where: { size }, order: { timestamp: 'ASC' } });

        return JSON.parse(JSON.stringify(candles)).map((candle) => {
            candle.timestamp = +candle.timestamp;

            return candle;
        });
    }

    private isInTestRange(candle: CandleModel): boolean {
        //return candle.timestamp > DateTime.fromObject({ year: 2018, month: 12, day: 1 }).toMillis();
        /*return (
             candle.timestamp > DateTime.fromObject({ year: 2022, month: 9, day: 1 }).toMillis() &&
             candle.timestamp < DateTime.fromObject({ year: 2023, month: 9, day: 1 }).toMillis()
        );*/
        return candle.timestamp > 0;
    }
}
