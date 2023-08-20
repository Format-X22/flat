import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { EHmaType } from '../../loader/candle.model';

export class RestartDetect extends AbstractDetect {
    protected profitMul = 2;
    protected enterFib = 1;
    protected takeFib = 2;
    protected stopFib = 0.73;

    protected minSegmentSizeMore = 1;
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
            const fib73 = this.getFib(lastUpWaveMax, lastDownWaveMin, 0.73, true);

            if (
                this.lt(this.candleMax(this.getCandle()), currentUpWaveMax) &&
                this.sizeGt(current, this.minSegmentSizeMore) &&
                this.sizeLt(current, prev1.size) &&
                this.lt(this.segmentMin(current), fib5) &&
                this.lt(currentUpWaveMax, fib73) &&
                this.gt(this.segmentMin(current), lastDownWaveMin) &&
                this.gt(lastUpWaveMax, currentUpWaveMax)
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
            const fib73 = this.getFib(last2UpWaveMax, lastDownWaveMin, 0.73, true);

            if (
                this.lt(this.candleMax(this.getCandle()), lastUpWaveMax) &&
                this.sizeGt(prev1, this.minSegmentSizeMore) &&
                this.sizeLt(prev1, prev2.size) &&
                this.sizeLte(current, prev1.size) &&
                this.lt(currentDownWaveMin, fib5) &&
                this.lt(lastUpWaveMax, fib73) &&
                this.gt(currentDownWaveMin, lastDownWaveMin) &&
                this.gt(last2UpWaveMax, lastUpWaveMax)
            ) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        }
    }
}

export class UpRestartDetect extends RestartDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP RESTART', true, segmentService, detectorService);
    }
}

export class DownRestartDetect extends RestartDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN RESTART', false, segmentService, detectorService);
    }
}

export class UpMidRestartDetect extends RestartDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSizeMore = 3;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP MID RESTART', true, segmentService, detectorService);
    }
}

export class DownMidRestartDetect extends RestartDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSizeMore = 3;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN MID RESTART', false, segmentService, detectorService);
    }
}
