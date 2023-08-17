import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';

export class FlagDetect extends AbstractDetect {
    check(): boolean {
        const [current, prev1, prev2, prev3, prev4] = this.getSegments(5);

        if (!prev3) {
            return false;
        }

        if (this.isSegmentDown(current)) {
            const currentUpWaveMax = this.max(current, prev1);
            const lastUpWaveMax = this.max(prev2, prev3);
            const lastDownWaveMin = this.min(prev1, prev2);
            const fib5 = this.getFib(currentUpWaveMax, lastDownWaveMin, 0.5, true);

            if (
                this.sizeGt(current, 1) &&
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
                this.sizeGt(current, 1) &&
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
    constructor(segmentService: SegmentService) {
        super('UP FLAG', true, segmentService);
    }
}

export class DownFlagDetect extends FlagDetect {
    constructor(segmentService: SegmentService) {
        super('DOWN FLAG', false, segmentService);
    }
}
