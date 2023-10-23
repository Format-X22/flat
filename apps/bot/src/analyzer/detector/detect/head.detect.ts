import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { EHmaType } from '../../../data/candle.model';

export class HeadDetect extends AbstractDetect {
    protected profitMul = 2;
    protected enterFib = 1;
    protected takeFib = 2;
    protected stopFib = 0.73;

    protected minSegmentSize = 2;
    protected waitDays = 2;

    check(): boolean {
        const [down0, up1, down1, up2, down2, up3] = this.getWaves(6, false);

        if (!up3) {
            return;
        }

        const notOverflow = down0.maxLt(up1.max);
        const minRightLevel = this.getFib(up2.max, down1.min, 0.73, true);
        const maxRightLevel = this.getFib(up2.max, down1.min, 1.43, true);
        const minHeadOffset = this.getFib(up1.max, down1.min, 0.15, true);
        const headBodyOffset = this.getFib(up1.max, down0.min, 0.5, true);
        const candleInHalfDown = down0.candles.some((candle) => this.lt(this.candleMax(candle), headBodyOffset));

        if (
            notOverflow &&
            down0.minGt(down1.min) &&
            down1.minLt(down2.min) &&
            up2.maxLt(up3.max) &&
            up1.maxGt(minRightLevel) &&
            up1.maxLt(maxRightLevel) &&
            down0.minGt(minHeadOffset) &&
            candleInHalfDown &&
            up1.sizeLeft >= this.minSegmentSize &&
            up1.sizeRight >= this.minSegmentSize &&
            up2.sizeLeft >= this.minSegmentSize &&
            up2.sizeRight >= this.minSegmentSize
        ) {
            return this.markDetection();
        } else {
            return this.markEndDetection();
        }
    }
}

export class UpHeadDetect extends HeadDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP HEAD', true, segmentService, detectorService);
    }
}

export class DownHeadDetect extends HeadDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN HEAD', false, segmentService, detectorService);
    }
}

export class UpMidHeadDetect extends HeadDetect {
    protected hmaType = EHmaType.MID_HMA;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP MID HEAD', true, segmentService, detectorService);
    }
}

export class DownMidHeadDetect extends HeadDetect {
    protected hmaType = EHmaType.MID_HMA;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN MID HEAD', false, segmentService, detectorService);
    }
}

export class UpBigHeadDetect extends HeadDetect {
    protected hmaType = EHmaType.BIG_HMA;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP BIG HEAD', true, segmentService, detectorService);
    }
}

export class DownBigHeadDetect extends HeadDetect {
    protected hmaType = EHmaType.BIG_HMA;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN BIG HEAD', false, segmentService, detectorService);
    }
}
