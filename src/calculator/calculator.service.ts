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
    private upTrendBreakDetected: boolean = false;
    private downTrendBreakDetected: boolean = false;
    private upTriangleBreakDetected: boolean = false;
    private downTriangleBreakDetected: boolean = false;
    private upTriangleBackDetected: boolean = false;
    private downTriangleBackDetected: boolean = false;
    private upRestartTrendDetected: boolean = false;
    private downRestartTrendDetected: boolean = false;
    private upMicroWaveDetected: boolean = false;
    private downMicroWaveDetected: boolean = false;

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
            this.checkUpTrendBreak();
            this.checkDownTrendBreak();
        }

        /*console.log(this.segmentUtil.getCurrentSegment());
        console.log(this.segmentUtil.getPrevSegment(1));
        console.log(this.segmentUtil.getPrevSegment(2));
        console.log(this.segmentUtil.getPrevSegment(3));
        console.log(this.segmentUtil.getPrevSegment(4));
        console.log(this.segmentUtil.getPrevSegment(5));
        console.log(this.segmentUtil.getPrevSegment(6));
        console.log(this.segmentUtil.getPrevSegment(7));
        console.log(this.segmentUtil.getPrevSegment(8));
        console.log(this.segmentUtil.getPrevSegment(9));
        console.log(this.segmentUtil.getPrevSegment(10));*/

        // TODO -
    }

    private getCandles(size: string): Promise<Array<CandleModel>> {
        return this.candleRepo.find({ where: { size }, order: { timestamp: 'ASC' } });
    }

    private checkUpFlag(): void {
        const candle = this.segmentUtil.getCurrentCandle();
        const [current, prev1, prev2, prev3] = this.segmentUtil.getSegments(4);

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
        const [current, prev1, prev2, prev3] = this.segmentUtil.getSegments(4);

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

    private checkUpTrendBreak(): void {
        const candle = this.segmentUtil.getCurrentCandle();
        const [current, prev1, prev2, prev3, prev4] = this.segmentUtil.getSegments(5);

        if (!prev4) {
            return;
        }

        if (current.isUp) {
            const lastUpWaveMax = Math.max(prev1.max, prev2.max);
            const lastDownWaveMin = Math.min(current.min, prev1.min);
            const last2DownWaveMin = Math.min(prev2.min, prev3.min);
            const fib5 = (current.max - lastDownWaveMin) * 0.5 + lastDownWaveMin;
            const fib62 = (current.max - lastDownWaveMin) * (1 - 0.62) + lastDownWaveMin;
            const candlesForFibCheck = current.candles;
            let someCandleInFib5AndNotOverflow = false;
            let someCandleInFib5 = false;

            for (const item of candlesForFibCheck) {
                if (!someCandleInFib5 && item.low > fib5) {
                    someCandleInFib5 = true;
                    someCandleInFib5AndNotOverflow = true;
                }

                if (someCandleInFib5 && someCandleInFib5AndNotOverflow && item.low <= fib62) {
                    someCandleInFib5AndNotOverflow = false;
                }
            }

            if (current.max > lastUpWaveMax && lastDownWaveMin > last2DownWaveMin && someCandleInFib5AndNotOverflow) {
                if (!this.upTrendBreakDetected) {
                    this.logger.verbose(`UP TREND BREAK - ${candle.dateString}`);
                }

                this.upTrendBreakDetected = true;
            } else {
                this.upTrendBreakDetected = false;
            }
        } else {
            const lastUpWaveMax = Math.max(prev2.max, prev3.max);
            const lastDownWaveMin = Math.min(prev1.min, prev2.min);
            const last2DownWaveMin = Math.min(prev3.min, prev4.min);
            const currentUpWaveMax = Math.max(current.max, prev1.max);
            const fib5 = (currentUpWaveMax - lastDownWaveMin) * 0.5 + lastDownWaveMin;
            const fib62 = (currentUpWaveMax - lastDownWaveMin) * (1 - 0.62) + lastDownWaveMin;
            const candlesForFibCheck = [...prev1.candles, ...current.candles];
            let someCandleInFib5AndNotOverflow = false;
            let someCandleInFib5 = false;

            for (const item of candlesForFibCheck) {
                if (!someCandleInFib5 && item.low > fib5) {
                    someCandleInFib5 = true;
                    someCandleInFib5AndNotOverflow = true;
                }

                if (someCandleInFib5 && someCandleInFib5AndNotOverflow && item.low <= fib62) {
                    someCandleInFib5AndNotOverflow = false;
                }
            }

            if (current.max > lastUpWaveMax && lastDownWaveMin > last2DownWaveMin && someCandleInFib5AndNotOverflow) {
                if (!this.upTrendBreakDetected) {
                    this.logger.verbose(`UP TREND BREAK - ${candle.dateString}`);
                }

                this.upTrendBreakDetected = true;
            } else {
                this.upTrendBreakDetected = false;
            }
        }
    }

    private checkDownTrendBreak(): void {
        const candle = this.segmentUtil.getCurrentCandle();
        const [current, prev1, prev2, prev3, prev4] = this.segmentUtil.getSegments(5);

        if (!prev4) {
            return;
        }

        if (current.isDown) {
            const lastDownWaveMin = Math.min(prev1.min, prev2.min);
            const lastUpWaveMax = Math.max(current.max, prev1.max);
            const last2UpWaveMax = Math.max(prev2.max, prev3.max);
            const fib5 = (lastUpWaveMax - current.min) * 0.5 + current.min;
            const fib62 = (lastUpWaveMax - current.min) * 0.62 + current.min;
            const candlesForFibCheck = current.candles;
            let someCandleInFib5AndNotOverflow = false;
            let someCandleInFib5 = false;

            for (const item of candlesForFibCheck) {
                if (!someCandleInFib5 && item.high < fib5) {
                    someCandleInFib5 = true;
                    someCandleInFib5AndNotOverflow = true;
                }

                if (someCandleInFib5 && someCandleInFib5AndNotOverflow && item.high >= fib62) {
                    someCandleInFib5AndNotOverflow = false;
                }
            }

            if (current.min < lastDownWaveMin && lastUpWaveMax < last2UpWaveMax && someCandleInFib5AndNotOverflow) {
                if (!this.downTrendBreakDetected) {
                    this.logger.verbose(`DOWN TREND BREAK - ${candle.dateString}`);
                }

                this.downTrendBreakDetected = true;
            } else {
                this.downTrendBreakDetected = false;
            }
        } else {
            const lastDownWaveMin = Math.min(prev2.min, prev3.min);
            const lastUpWaveMax = Math.max(prev1.max, prev2.max);
            const last2UpWaveMax = Math.max(prev3.max, prev4.max);
            const currentDownWaveMin = Math.min(current.min, prev1.min);
            const fib5 = (lastUpWaveMax - currentDownWaveMin) * 0.5 + currentDownWaveMin;
            const fib62 = (lastUpWaveMax - currentDownWaveMin) * 0.62 + currentDownWaveMin;
            const candlesForFibCheck = [...prev1.candles, ...current.candles];
            let someCandleInFib5AndNotOverflow = false;
            let someCandleInFib5 = false;

            for (const item of candlesForFibCheck) {
                if (!someCandleInFib5 && item.high < fib5) {
                    someCandleInFib5 = true;
                    someCandleInFib5AndNotOverflow = true;
                }

                if (someCandleInFib5 && someCandleInFib5AndNotOverflow && item.high >= fib62) {
                    someCandleInFib5AndNotOverflow = false;
                }
            }

            if (current.min < lastDownWaveMin && lastUpWaveMax < last2UpWaveMax && someCandleInFib5AndNotOverflow) {
                if (!this.downTrendBreakDetected) {
                    this.logger.verbose(`DOWN TREND BREAK - ${candle.dateString}`);
                }

                this.downTrendBreakDetected = true;
            } else {
                this.downTrendBreakDetected = false;
            }
        }
    }

    private checkUpTriangleBreak(): void {
        // TODO -
    }

    private checkDownTriangleBreak(): void {
        // TODO -
    }

    private checkUpTriangleBack(): void {
        // TODO -
    }

    private checkDownTriangleBack(): void {
        // TODO -
    }

    private checkUpRestartTrend(): void {
        // TODO -
    }

    private checkDownRestartTrend(): void {
        // TODO -
    }

    private checkUpMicroWave(): void {
        // TODO -
    }

    private checkDownMicroWave(): void {
        // TODO -
    }

    private isInTestRange(): boolean {
        const candle = this.segmentUtil.getCurrentCandle();

        return candle.timestamp > 1659372330916;
    }
}
