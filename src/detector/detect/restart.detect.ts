import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';

export class RestartDetect extends AbstractDetect {
    profitMul = 2;

    check(): boolean {
        const [current, prev1, prev2, prev3] = this.getSegments(4);

        if (!prev3) {
            return false;
        }

        const currentUpWaveMax = this.max(current, prev1);
        const lastUpWaveMax = this.max(prev2, prev3);
        const lastDownWaveMin = this.min(prev1, prev2);
        const fib73 = this.getFib(lastUpWaveMax, lastDownWaveMin, 0.73, true);

        if (
            this.sizeGt(current, 1) &&
            this.isSegmentDown(current) &&
            this.gt(this.segmentMin(current), lastDownWaveMin) &&
            this.gt(lastUpWaveMax, currentUpWaveMax) &&
            this.lt(currentUpWaveMax, fib73)
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
