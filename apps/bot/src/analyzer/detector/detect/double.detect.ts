import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { EHmaType } from '../../../data/candle.model';

export class DoubleDetect extends AbstractDetect {
    protected profitMul = 1.95;
    protected enterFib = 0.85;
    protected takeFib = 2;
    protected stopFib = 0.62;

    protected waitDays = 2;

    check(): boolean {
        const [down0, up1, down1, up2, down2] = this.getWaves(5, false);

        if (!down2) {
            return;
        }

        // TODO -
    }
}

export class UpDoubleDetect extends DoubleDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP DOUBLE', true, segmentService, detectorService);
    }
}

export class DownDoubleDetect extends DoubleDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN DOUBLE', false, segmentService, detectorService);
    }
}

export class UpMidDoubleDetect extends DoubleDetect {
    protected hmaType = EHmaType.MID_HMA;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP MID DOUBLE', true, segmentService, detectorService);
    }
}

export class DownMidDoubleDetect extends DoubleDetect {
    protected hmaType = EHmaType.MID_HMA;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN MID DOUBLE', false, segmentService, detectorService);
    }
}

export class UpBigDoubleDetect extends DoubleDetect {
    protected hmaType = EHmaType.BIG_HMA;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP BIG DOUBLE', true, segmentService, detectorService);
    }
}

export class DownBigDoubleDetect extends DoubleDetect {
    protected hmaType = EHmaType.BIG_HMA;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN BIG DOUBLE', false, segmentService, detectorService);
    }
}
