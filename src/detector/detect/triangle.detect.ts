import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';

export class TriangleDetect extends AbstractDetect {
    profitMul = 1.4;
    enterFib = 1;
    takeFib = 1.8;
    stopFib = 0.5;

    check(): boolean {
        const [current, prev1, prev2, prev3, prev4, prev5] = this.getSegments(6);

        if (!prev5) {
            return false;
        }

        if (this.isSegmentDown(current)) {
            const currentUpWaveMax = this.max(current, prev1);
            const lastUpWaveMax = this.max(prev2, prev3);
            const lastDownWaveMin = this.min(prev1, prev2);
            const last2DownWaveMin = this.min(prev3, prev4);
            const fib35 = this.getFib(lastUpWaveMax, lastDownWaveMin, 0.35, true);

            if (
                this.sizeGt(current, 1) &&
                this.sizeGt(prev1, 1) &&
                this.sizeGt(prev2, 1) &&
                this.sizeGt(prev3, 1) &&
                this.sizeGt(prev4, 1) &&
                this.gt(lastUpWaveMax, currentUpWaveMax) &&
                this.lt(lastDownWaveMin, this.segmentMin(current)) &&
                this.lt(last2DownWaveMin, fib35)
            ) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        } else {
            const lastUpWaveMax = this.max(prev1, prev2);
            const last2UpWaveMax = this.max(prev3, prev4);
            const currentDownWaveMin = this.min(current, prev1);
            const lastDownWaveMin = this.min(prev2, prev3);
            const last2DownWaveMin = this.min(prev4, prev5);
            const fib35 = this.getFib(last2UpWaveMax, lastDownWaveMin, 0.35, true);

            if (
                this.sizeGt(prev1, 1) &&
                this.sizeGt(prev2, 1) &&
                this.sizeGt(prev3, 1) &&
                this.sizeGt(prev4, 1) &&
                this.sizeGt(prev5, 1) &&
                this.lte(this.segmentMax(current), lastUpWaveMax) &&
                this.gt(last2UpWaveMax, lastUpWaveMax) &&
                this.lt(lastDownWaveMin, currentDownWaveMin) &&
                this.lt(last2DownWaveMin, fib35)
            ) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        }
    }

    trade() {
        this.handleOrder(4);
        this.handleTradeDetection();
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
