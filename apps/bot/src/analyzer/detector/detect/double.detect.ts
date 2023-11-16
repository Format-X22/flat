import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { EHmaType } from '../../../data/candle.model';

export class DoubleDetect extends AbstractDetect {
    protected enterFib = 0.85;
    protected takeFib = 2;
    protected stopFib = 0.62;

    protected minSegmentSize = 2;
    protected maxSecondSegmentSize = 2;
    protected waitDays = 2;

    constructor(name: string, isNotInverted = true, segmentService: SegmentService, detectorService: DetectorService) {
        super(name, isNotInverted, segmentService, detectorService);
        this.init();
    }

    check(): boolean {
        const [down0, up1, down1, up2, down2, up3] = this.getWaves(6, false);

        if (!down2) {
            return;
        }

        const notOverflow = up1.maxGte(down0.max);
        const trendOffsetFirst = this.getFib(up2.max, down2.min, 0.5, true);
        const pennantBodyOffsetSecond = this.getFib(up1.max, down0.min, 0.5, true);
        const candleInHalfDownSecond = down0.candles.some((candle) =>
            this.lt(this.candleMax(candle), pennantBodyOffsetSecond),
        );

        if (
            notOverflow &&
            down0.sizeLeft >= this.minSegmentSize &&
            down1.minGt(trendOffsetFirst) &&
            up3.maxLt(down0.min) &&
            candleInHalfDownSecond &&
            up1.maxGt(up2.max) &&
            down0.minGt(down1.min) &&
            down0.minLt(up2.max)
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
