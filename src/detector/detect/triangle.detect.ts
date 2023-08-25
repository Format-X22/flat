import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { EHmaType } from '../../loader/candle.model';

export class TriangleDetect extends AbstractDetect {
    protected profitMul = 1.5;
    protected enterFib = 1;
    protected takeFib = 1.8;
    protected stopFib = 0.62;

    protected waitDays = 4;
    protected minSegmentSizeMore = 1;

    check(): boolean {
        const [current, prev1, prev2, prev3, prev4, prev5, prev6] = this.getSegments(7);

        if (!prev6) {
            return false;
        }

        if (this.isSegmentDown(current)) {
            const currentUpWaveMax = this.max(current, prev1);
            const lastUpWaveMax = this.max(prev2, prev3);
            const last2UpWaveMax = this.max(prev4, prev5);
            const lastDownWaveMin = this.min(prev1, prev2);
            const last2DownWaveMin = this.min(prev3, prev4);
            const fib35 = this.getFib(lastUpWaveMax, lastDownWaveMin, 0.35, true);
            const fib5 = this.getFib(lastUpWaveMax, lastDownWaveMin, 0.5, true);

            if (
                this.lt(this.candleMax(this.getCandle()), currentUpWaveMax) &&
                this.sizeGt(current, this.minSegmentSizeMore) &&
                this.sizeGt(prev1, this.minSegmentSizeMore) &&
                this.sizeGt(prev2, this.minSegmentSizeMore) &&
                this.sizeGt(prev3, this.minSegmentSizeMore) &&
                this.gt(lastUpWaveMax, currentUpWaveMax) &&
                this.gt(last2UpWaveMax, lastUpWaveMax) &&
                this.lt(lastDownWaveMin, this.segmentMin(current)) &&
                this.lt(last2DownWaveMin, lastDownWaveMin) &&
                this.lt(last2DownWaveMin, fib35) &&
                this.gt(currentUpWaveMax, fib5)
            ) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        } else {
            const lastUpWaveMax = this.max(prev1, prev2);
            const last2UpWaveMax = this.max(prev3, prev4);
            const last3UpWaveMax = this.max(prev5, prev6);
            const currentDownWaveMin = this.min(current, prev1);
            const lastDownWaveMin = this.min(prev2, prev3);
            const last2DownWaveMin = this.min(prev4, prev5);
            const fib35 = this.getFib(last2UpWaveMax, lastDownWaveMin, 0.35, true);
            const fib5 = this.getFib(last2UpWaveMax, lastDownWaveMin, 0.5, true);

            if (
                this.lte(this.candleMax(this.getCandle()), lastUpWaveMax) &&
                this.sizeGt(prev1, this.minSegmentSizeMore) &&
                this.sizeGt(prev2, this.minSegmentSizeMore) &&
                this.sizeGt(prev3, this.minSegmentSizeMore) &&
                this.sizeGt(prev4, this.minSegmentSizeMore) &&
                this.gt(last2UpWaveMax, lastUpWaveMax) &&
                this.gt(last3UpWaveMax, last2UpWaveMax) &&
                this.lt(lastDownWaveMin, currentDownWaveMin) &&
                this.lt(last2DownWaveMin, fib35) &&
                this.lt(last2DownWaveMin, lastDownWaveMin) &&
                this.gt(lastUpWaveMax, fib5)
            ) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        }
    }
}

export class UpTriangleDetect extends TriangleDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP TRIANGLE', true, segmentService, detectorService);
    }
}

export class DownTriangleDetect extends TriangleDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN TRIANGLE', false, segmentService, detectorService);
    }
}

export class UpMidTriangleDetect extends TriangleDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSizeMore = 3;
    protected waitDays = 8;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP MID TRIANGLE', true, segmentService, detectorService);
    }
}

export class DownMidTriangleDetect extends TriangleDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSizeMore = 3;
    protected waitDays = 8;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN MID TRIANGLE', false, segmentService, detectorService);
    }
}

export class UpBigTriangleDetect extends TriangleDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSizeMore = 5;
    protected waitDays = 12;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP BIG TRIANGLE', true, segmentService, detectorService);
    }
}

export class DownBigTriangleDetect extends TriangleDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSizeMore = 5;
    protected waitDays = 12;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN BIG TRIANGLE', false, segmentService, detectorService);
    }
}
