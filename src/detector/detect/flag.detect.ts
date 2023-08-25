import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { EHmaType } from '../../loader/candle.model';

// TODO If candles under 0.5 - enter 0.62.. in another detector?
export class FlagDetect extends AbstractDetect {
    protected profitMul = 2;
    protected enterFib = 1;
    protected takeFib = 2;
    protected stopFib = 0.73;

    protected minSegmentSizeMore = 1;
    protected maxSecondSegmentSizeMore = 2;
    protected waitDays = 2;

    check(): boolean {
        const [current, prev1, prev2, prev3, prev4] = this.getSegments(5);

        if (!prev4) {
            return false;
        }

        if (this.isSegmentDown(current)) {
            const currentUpWaveMax = this.max(current, prev1);
            const lastUpWaveMax = this.max(prev2, prev3);
            const lastDownWaveMin = this.min(prev1, prev2);
            const fib5 = this.getFib(currentUpWaveMax, lastDownWaveMin, 0.5, true);

            if (
                this.lt(this.candleMax(this.getCandle()), currentUpWaveMax) &&
                this.sizeGt(current, this.minSegmentSizeMore) &&
                this.gt(this.segmentMin(current), fib5) &&
                this.lt(lastUpWaveMax, this.segmentMin(current)) &&
                this.gte(currentUpWaveMax, this.segmentMax(current))
            ) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        } else {
            const currentDownWaveMin = this.min(current, prev1);
            const lastUpWaveMax = this.max(prev1, prev2);
            const last2UpWaveMax = this.max(prev3, prev4);
            const lastDownWaveMin = this.min(prev2, prev3);
            const fib5 = this.getFib(lastUpWaveMax, lastDownWaveMin, 0.5, true);

            if (
                this.lt(this.candleMax(this.getCandle()), lastUpWaveMax) &&
                this.sizeGt(prev1, this.minSegmentSizeMore) &&
                this.sizeLt(current, this.maxSecondSegmentSizeMore) &&
                this.gt(currentDownWaveMin, fib5) &&
                this.lt(last2UpWaveMax, currentDownWaveMin) &&
                this.gte(lastUpWaveMax, this.segmentMax(current))
            ) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        }
    }
}

export class UpFlagDetect extends FlagDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP FLAG', true, segmentService, detectorService);
    }
}

export class DownFlagDetect extends FlagDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN FLAG', false, segmentService, detectorService);
    }
}

export class UpMidFlagDetect extends FlagDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSizeMore = 3;
    protected maxSecondSegmentSizeMore = 2;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP MID FLAG', true, segmentService, detectorService);
    }
}

export class DownMidFlagDetect extends FlagDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSizeMore = 3;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN MID FLAG', false, segmentService, detectorService);
    }
}

export class UpBigFlagDetect extends FlagDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected maxSecondSegmentSizeMore = 4;
    protected minSegmentSizeMore = 7;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP BIG FLAG', true, segmentService, detectorService);
    }
}

export class DownBigFlagDetect extends FlagDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected maxSecondSegmentSizeMore = 4;
    protected minSegmentSizeMore = 7;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN BIG FLAG', false, segmentService, detectorService);
    }
}
