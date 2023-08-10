import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel } from '../loader/candle.model';
import { Repository } from 'typeorm';
import { SegmentUtil } from './segment.util';

@Injectable()
export class CalculatorService {
    private readonly logger: Logger = new Logger(CalculatorService.name);

    constructor(@InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>) {}

    async calc(): Promise<void> {
        const candles = await this.getCandles('1d');
        const segmentUtil = new SegmentUtil();

        for (const candle of candles) {
            segmentUtil.addCandle(candle);
        }

        console.log(segmentUtil.getPrevSegment(4));
        console.log(segmentUtil.getPrevSegment(3));
        console.log(segmentUtil.getPrevSegment(2));
        console.log(segmentUtil.getPrevSegment(1));
        console.log(segmentUtil.getCurrentSegment());

        // TODO -
    }

    private getCandles(size: string): Promise<Array<CandleModel>> {
        return this.candleRepo.find({ where: { size }, order: { timestamp: 'ASC' } });
    }
}
