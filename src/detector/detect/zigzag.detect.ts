import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';

export class ZigzagDetect extends AbstractDetect {
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

        if (
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
}

export class UpZigzagDetect extends ZigzagDetect {
    constructor(segmentService: SegmentService) {
        super('UP ZIGZAG', true, segmentService);
    }
}

export class DownZigzagDetect extends ZigzagDetect {
    constructor(segmentService: SegmentService) {
        super('DOWN ZIGZAG', false, segmentService);
    }
}
