import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel } from '../loader/candle.model';
import { Repository } from 'typeorm';
import { SegmentUtil } from './segment.util';

// TODO Filtrate flags with mass near border

@Injectable()
export class CalculatorService {
    private readonly logger: Logger = new Logger(CalculatorService.name);
    private readonly segmentUtil: SegmentUtil = new SegmentUtil();

    private upFlagDetected: boolean = false;
    private downFlagDetected: boolean = false;

    constructor(@InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>) {}

    async calc(): Promise<void> {
        const candles = await this.getCandles('1d');

        for (const candle of candles) {
            this.segmentUtil.addCandle(candle);

            if (!this.isInTestRange()) {
                continue;
            }

            this.checkUpFlag();
            this.checkDownFlag();
        }

        // TODO -
    }

    private getCandles(size: string): Promise<Array<CandleModel>> {
        return this.candleRepo.find({ where: { size }, order: { timestamp: 'ASC' } });
    }

    private checkUpFlag(): void {
        const candle = this.segmentUtil.getCurrentCandle();
        const current = this.segmentUtil.getCurrentSegment();
        const prev1 = this.segmentUtil.getPrevSegment(1);
        const prev2 = this.segmentUtil.getPrevSegment(2);
        const prev3 = this.segmentUtil.getPrevSegment(3);

        if (!prev3) {
            return;
        }

        const currentUpWaveMax = Math.max(current.max, prev1.max);
        const lastUpWaveMax = Math.max(prev2.max, prev3.max);
        const lastDownWaveMin = Math.min(prev1.min, prev2.min);
        const fib5 = (currentUpWaveMax - lastDownWaveMin) * 0.5 + lastDownWaveMin;

        if (current.isDown && current.min > fib5 && lastUpWaveMax < current.min) {
            if (!this.upFlagDetected) {
                this.logger.verbose(`UP FLAG - ${candle.dateString}`);
            }

            this.upFlagDetected = true;
        } else {
            this.upFlagDetected = false;
        }
    }

    private checkDownFlag(): void {
        const candle = this.segmentUtil.getCurrentCandle();
        const current = this.segmentUtil.getCurrentSegment();
        const prev1 = this.segmentUtil.getPrevSegment(1);
        const prev2 = this.segmentUtil.getPrevSegment(2);
        const prev3 = this.segmentUtil.getPrevSegment(3);

        if (!prev3) {
            return;
        }

        const currentDownWaveMin = Math.min(current.min, prev1.min);
        const lastDownWaveMin = Math.min(prev2.min, prev3.min);
        const lastUpWaveMax = Math.max(prev1.max, prev2.max);
        const fib5 = (lastUpWaveMax - currentDownWaveMin) * 0.5 + currentDownWaveMin;

        if (current.isUp && current.max < fib5 && lastDownWaveMin > current.max) {
            if (!this.downFlagDetected) {
                this.logger.verbose(`DOWN FLAG - ${candle.dateString}`);
            }

            this.downFlagDetected = true;
        } else {
            this.downFlagDetected = false;
        }
    }

    private isInTestRange(): boolean {
        const candle = this.segmentUtil.getCurrentCandle();

        return candle.timestamp > 1659372330916;
    }
}
