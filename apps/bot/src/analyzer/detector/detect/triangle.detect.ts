import { AbstractDetect } from './abstract.detect';
import { EHmaType } from '../../../data/candle.model';
import { SegmentUtil } from '../../wave/segment.util';
import { DetectorExecutor } from '../detector.executor';

export class TriangleDetect extends AbstractDetect {
    protected enterFib = 1;
    protected takeFib = 1.75;
    protected stopFib = 0.5;

    protected waitDays = 4;
    protected minSegmentSize = 2;

    check(): boolean {
        const [down0, up1, down1, up2, down2] = this.getWaves(5, false);

        if (!down2) {
            return;
        }

        const notOverflow = down0.maxLt(up1.max);
        const triangleOffset = this.getFib(up1.max, down2.min, 0.5, true);
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            notOverflow &&
            down0.minGt(down1.min) &&
            down1.minGt(down2.min) &&
            up1.maxLt(up2.max) &&
            down1.minLt(triangleOffset) &&
            down1.sizeLeft >= this.minSegmentSize &&
            down1.sizeRight >= this.minSegmentSize &&
            highBeforeLow
        ) {
            return this.markDetection();
        } else {
            return this.markEndDetection();
        }
    }
}

export class Up extends TriangleDetect {
    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP TRIANGLE', true, segmentUtil, detectorExecutor);
    }
}

export class Down extends TriangleDetect {
    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN TRIANGLE', false, segmentUtil, detectorExecutor);
    }
}

export class UpMid extends TriangleDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSize = 4;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP MID TRIANGLE', true, segmentUtil, detectorExecutor);
    }
}

export class DownMid extends TriangleDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSize = 4;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN MID TRIANGLE', false, segmentUtil, detectorExecutor);
    }
}

export class UpBig extends TriangleDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSize = 8;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP BIG TRIANGLE', true, segmentUtil, detectorExecutor);
    }
}

export class DownBig extends TriangleDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSize = 8;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN BIG TRIANGLE', false, segmentUtil, detectorExecutor);
    }
}
