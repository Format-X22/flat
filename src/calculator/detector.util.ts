import { SegmentUtil } from './segment.util';
import { Logger } from '@nestjs/common';

export class DetectorUtil {
    private readonly logger: Logger = new Logger(DetectorUtil.name);

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

    constructor(private readonly segmentUtil: SegmentUtil) {}

    checkUpFlag(): boolean {
        const candle = this.segmentUtil.getCurrentCandle();
        const [current, prev1, prev2, prev3] = this.segmentUtil.getSegments(4);

        if (!prev3) {
            return false;
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

            return true;
        } else {
            this.upFlagDetected = false;

            return false;
        }
    }

    checkDownFlag(): boolean {
        const candle = this.segmentUtil.getCurrentCandle();
        const [current, prev1, prev2, prev3] = this.segmentUtil.getSegments(4);

        if (!prev3) {
            return false;
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

            return true;
        } else {
            this.downFlagDetected = false;

            return false;
        }
    }

    checkUpTrendBreak(): boolean {
        const candle = this.segmentUtil.getCurrentCandle();
        const [current, prev1, prev2, prev3, prev4] = this.segmentUtil.getSegments(5);

        if (!prev4) {
            return false;
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

                return true;
            } else {
                this.upTrendBreakDetected = false;

                return false;
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

                return true;
            } else {
                this.upTrendBreakDetected = false;

                return false;
            }
        }
    }

    checkDownTrendBreak(): boolean {
        const candle = this.segmentUtil.getCurrentCandle();
        const [current, prev1, prev2, prev3, prev4] = this.segmentUtil.getSegments(5);

        if (!prev4) {
            return false;
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

                return true;
            } else {
                this.downTrendBreakDetected = false;

                return false;
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

                return true;
            } else {
                this.downTrendBreakDetected = false;

                return false;
            }
        }
    }

    checkUpTriangleBreak(): boolean {
        // TODO -

        return false;
    }

    checkDownTriangleBreak(): boolean {
        // TODO -

        return false;
    }

    checkUpTriangleBack(): boolean {
        // TODO -

        return false;
    }

    checkDownTriangleBack(): boolean {
        // TODO -

        return false;
    }

    checkUpRestartTrend(): boolean {
        const candle = this.segmentUtil.getCurrentCandle();
        const [current, prev1, prev2, prev3] = this.segmentUtil.getSegments(4);

        if (!prev3) {
            return false;
        }

        const currentUpWaveMax = Math.max(current.max, prev1.max);
        const lastUpWaveMax = Math.max(prev2.max, prev3.max);
        const lastDownWaveMin = Math.min(prev1.min, prev2.min);
        const fib73 = (lastUpWaveMax - lastDownWaveMin) * 0.73 + lastDownWaveMin;

        if (
            current.isDown &&
            current.min > lastDownWaveMin &&
            lastUpWaveMax > currentUpWaveMax &&
            currentUpWaveMax < fib73
        ) {
            if (!this.upRestartTrendDetected) {
                this.logger.verbose(`UP RESTART TREND - ${candle.dateString}`);
            }

            this.upRestartTrendDetected = true;

            return true;
        } else {
            this.upRestartTrendDetected = false;

            return false;
        }
    }

    checkDownRestartTrend(): boolean {
        const candle = this.segmentUtil.getCurrentCandle();
        const [current, prev1, prev2, prev3] = this.segmentUtil.getSegments(4);

        if (!prev3) {
            return false;
        }

        const currentDownWaveMin = Math.min(current.min, prev1.min);
        const lastDownWaveMin = Math.min(prev2.min, prev3.min);
        const lastUpWaveMax = Math.max(prev1.max, prev2.max);
        const fib73 = (lastUpWaveMax - lastDownWaveMin) * (1 - 0.73) + lastDownWaveMin;

        if (
            current.isUp &&
            current.max < lastUpWaveMax &&
            lastDownWaveMin < currentDownWaveMin &&
            currentDownWaveMin > fib73
        ) {
            if (!this.downRestartTrendDetected) {
                this.logger.verbose(`DOWN RESTART TREND - ${candle.dateString}`);
            }

            this.downRestartTrendDetected = true;

            return true;
        } else {
            this.downRestartTrendDetected = false;

            return false;
        }
    }

    checkUpMicroWave(): boolean {
        // TODO -

        return false;
    }

    checkDownMicroWave(): boolean {
        // TODO -

        return false;
    }
}
