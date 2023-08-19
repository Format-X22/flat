import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';

export class FlagDetect extends AbstractDetect {
    profitMul = 2;
    enterFib = 1;
    takeFib = 2.95;
    stopFib = 0.5;

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
                this.sizeGt(prev1, 1) &&
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

    trade(): void {
        this.handleOrder(2);
        this.handleTradeDetection();
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
