import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { EHmaType } from '../../../data/candle.model';

export class TriangleDetect extends AbstractDetect {
    protected profitMul = 1.75;
    protected enterFib = 1;
    protected takeFib = 1.8;
    protected stopFib = 0.73;

    protected waitDays = 2;
    protected minSegmentSize = 2;

    check(): boolean {
        const [down0, up1, down1, up2, down2] = this.getWaves(5, false);

        if (!down2) {
            return;
        }

        const notOverflow = down0.maxLt(up1.max);

        if (
            notOverflow &&
            down0.minGt(down1.min) &&
            down1.minGt(down2.min) &&
            up1.maxLt(up2.max) &&
            down1.sizeLeft >= this.minSegmentSize &&
            down1.sizeRight >= this.minSegmentSize
        ) {
            return this.markDetection();
        } else {
            return this.markEndDetection();
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
    protected waitDays = 4;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP MID TRIANGLE', true, segmentService, detectorService);
    }
}

export class DownMidTriangleDetect extends TriangleDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected waitDays = 4;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN MID TRIANGLE', false, segmentService, detectorService);
    }
}

export class UpBigTriangleDetect extends TriangleDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected waitDays = 8;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP BIG TRIANGLE', true, segmentService, detectorService);
    }
}

export class DownBigTriangleDetect extends TriangleDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected waitDays = 8;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN BIG TRIANGLE', false, segmentService, detectorService);
    }
}
