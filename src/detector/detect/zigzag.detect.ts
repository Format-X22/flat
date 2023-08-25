import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { EHmaType } from '../../loader/candle.model';

export class ZigzagDetect extends AbstractDetect {
    protected profitMul = 2;
    protected enterFib = 0.62;
    protected takeFib = 1.8;
    protected stopFib = 0.33;

    protected waitDays = 4;
    protected minSegmentSizeMore = 1;

    check(): boolean {
        const [current, prev1, prev2, prev3, prev4, prev5, prev6, prev7] = this.getSegments(8);

        if (!prev7) {
            return false;
        }

        if (this.isSegmentDown(current)) {
            const lastDownWaveMin = this.min(prev1, prev2);
            const last2DownWaveMin = this.min(prev3, prev4);
            const currentUpWaveMax = this.max(current, prev1);
            const lastUpWaveMax = this.max(prev2, prev3);
            const last2UpWaveMax = this.max(prev4, prev5);
            const fib35 = this.getFib(last2DownWaveMin, lastUpWaveMax, 0.35, false);
            const fib5 = this.getFib(last2DownWaveMin, lastUpWaveMax, 0.5, false);
            const fib62 = this.getFib(currentUpWaveMax, this.segmentMin(current), 0.62, true);
            const fib62_5 = this.getFib(currentUpWaveMax, this.segmentMin(current), 0.5, true);
            const moveCandles = current.candles;

            if (
                this.lt(this.candleMax(this.getCandle()), fib62) &&
                this.sizeGt(prev2, this.minSegmentSizeMore) &&
                this.sizeGt(prev3, this.minSegmentSizeMore) &&
                this.sizeGt(prev4, this.minSegmentSizeMore) &&
                this.sizeGt(prev5, this.minSegmentSizeMore) &&
                this.sizeGt(prev6, this.minSegmentSizeMore) &&
                moveCandles.some((candle) => this.lt(this.candleMax(candle), fib62_5)) &&
                current.size < prev1.size + prev2.size + prev3.size &&
                this.lt(this.segmentMin(current), lastDownWaveMin) &&
                this.lt(last2DownWaveMin, lastDownWaveMin) &&
                this.lt(currentUpWaveMax, lastUpWaveMax) &&
                this.gt(last2UpWaveMax, fib35) &&
                this.lt(last2DownWaveMin, fib5)
            ) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        } else {
            const currentDownWaveMin = this.min(current, prev1);
            const lastDownWaveMin = this.min(prev2, prev3);
            const last2DownWaveMin = this.min(prev4, prev5);
            const lastUpWaveMax = this.max(prev1, prev2);
            const last2UpWaveMax = this.max(prev3, prev4);
            const last3UpWaveMax = this.max(prev5, prev6);
            const fib35 = this.getFib(last2DownWaveMin, last2UpWaveMax, 0.35, false);
            const fib5 = this.getFib(last2DownWaveMin, last2UpWaveMax, 0.5, false);
            const fib62 = this.getFib(lastUpWaveMax, currentDownWaveMin, 0.62, true);
            const fib62_5 = this.getFib(lastUpWaveMax, currentDownWaveMin, 0.5, true);
            const moveCandles = [...prev1.candles, ...current.candles];

            if (
                this.lt(this.candleMax(this.getCandle()), fib62) &&
                this.sizeGt(prev3, this.minSegmentSizeMore) &&
                this.sizeGt(prev4, this.minSegmentSizeMore) &&
                this.sizeGt(prev5, this.minSegmentSizeMore) &&
                this.sizeGt(prev6, this.minSegmentSizeMore) &&
                this.sizeGt(prev7, this.minSegmentSizeMore) &&
                current.size + prev1.size < prev2.size + prev3.size + prev4.size &&
                moveCandles.some((candle) => this.lt(this.candleMax(candle), fib62_5)) &&
                this.lt(currentDownWaveMin, lastDownWaveMin) &&
                this.lt(last2DownWaveMin, lastDownWaveMin) &&
                this.lt(lastUpWaveMax, last2UpWaveMax) &&
                this.gt(last3UpWaveMax, fib35) &&
                this.lt(last2DownWaveMin, fib5)
            ) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        }
    }
}

export class UpZigzagDetect extends ZigzagDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP ZIGZAG', true, segmentService, detectorService);
    }
}

export class DownZigzagDetect extends ZigzagDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN ZIGZAG', false, segmentService, detectorService);
    }
}

export class UpMidZigzagDetect extends ZigzagDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSizeMore = 3;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP MID ZIGZAG', true, segmentService, detectorService);
    }
}

export class DownMidZigzagDetect extends ZigzagDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSizeMore = 3;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN MID ZIGZAG', false, segmentService, detectorService);
    }
}

export class UpBigZigzagDetect extends ZigzagDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSizeMore = 5;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP BIG ZIGZAG', true, segmentService, detectorService);
    }
}

export class DownBigZigzagDetect extends ZigzagDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSizeMore = 5;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN BIG ZIGZAG', false, segmentService, detectorService);
    }
}
