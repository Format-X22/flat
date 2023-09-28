import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { EHmaType } from '../../../data/candle.model';

export class FlagDetect extends AbstractDetect {
    protected profitMul = 2;
    protected enterFib = 1;
    protected takeFib = 2;
    protected stopFib = 0.73;

    protected minSegmentSize = 2;
    protected maxSecondSegmentSize = 2;
    protected waitDays = 2;

    check(): boolean {
        const [down0, up1, down1, up2] = this.getWaves(4, false);

        if (!up2) {
            return;
        }

        const trendOffset = this.getFib(up1.max, down1.min, 0.5, true);
        const flagBodyOffset = this.getFib(up1.max, down0.min, 0.5, true);
        const notOverflow = up1.maxGte(down0.max);
        const candleNotInHalfDown = down0.candles.every((candle) => this.gt(this.candleMax(candle), flagBodyOffset));

        if (
            notOverflow &&
            down0.sizeLeft >= this.minSegmentSize &&
            down0.minGt(trendOffset) &&
            up2.maxLt(down0.min) &&
            candleNotInHalfDown
        ) {
            if (this.isCurrentSegmentDown() || down0.sizeRight < this.maxSecondSegmentSize) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        } else {
            return this.markEndDetection();
        }
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

export class UpMidFlagDetect extends FlagDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSize = 4;
    protected maxSecondSegmentSize = 2;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP MID FLAG', true, segmentService, detectorService);
    }
}

export class DownMidFlagDetect extends FlagDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSize = 4;
    protected maxSecondSegmentSize = 2;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN MID FLAG', false, segmentService, detectorService);
    }
}

export class UpBigFlagDetect extends FlagDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSize = 8;
    protected maxSecondSegmentSize = 4;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP BIG FLAG', true, segmentService, detectorService);
    }
}

export class DownBigFlagDetect extends FlagDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSize = 8;
    protected maxSecondSegmentSize = 4;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN BIG FLAG', false, segmentService, detectorService);
    }
}
