import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';

export class ZigzagDetect extends AbstractDetect {
    profitMul = 2.1;
    enterFib = 0;
    takeFib = 0;
    stopFib = 0;
    waitDays = 0;

    check(): boolean {
        const [current, prev1, prev2, prev3, prev4] = this.getSegments(5);

        if (!prev4) {
            return false;
        }

        const currentUpWaveMax = this.max(current, prev1);
        const lastUpWaveMax = this.max(prev2, prev3);
        const lastDownWaveMin = this.min(prev1, prev2);
        const last2DownWaveMin = this.min(prev3, prev4);
        const fib5 = this.getFib(lastUpWaveMax, last2DownWaveMin, 0.5, true);
        const fib35 = this.getFib(lastUpWaveMax, lastDownWaveMin, 0.35, true);
        const maxSize = (prev1.size + prev2.size + prev3.size) / 2;

        if (
            this.sizeGt(current, 1) &&
            this.sizeGt(prev2, 1) &&
            this.sizeGt(prev3, 1) &&
            this.sizeGt(prev4, 1) &&
            this.constLt(current.size, maxSize) &&
            this.isSegmentDown(current) &&
            this.lt(currentUpWaveMax, lastUpWaveMax) &&
            this.lt(this.segmentMin(current), lastDownWaveMin) &&
            this.lt(last2DownWaveMin, fib35) &&
            this.lt(lastDownWaveMin, fib5)
        ) {
            return this.markDetection();
        } else {
            return this.markEndDetection();
        }
    }

    trade() {
        // TODO -
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
