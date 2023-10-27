import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { EHmaType } from '../../../data/candle.model';

export class PennantDetect extends AbstractDetect {
    protected profitMul = 2.75;
    protected enterFib = 0.85;
    protected takeFib = 2.3;
    protected stopFib = 0.62;

    protected minSegmentSize = 2;
    protected maxSecondSegmentSize = 2;
    protected waitDays = 2;

    check(): boolean {
        const [down0, up1, down1, up2] = this.getWaves(4, false);

        if (!up2) {
            return;
        }

        const trendOffset = this.getFib(up1.max, down1.min, 0.5, true);
        const pennantBodyOffset = this.getFib(up1.max, down0.min, 0.5, true);
        const notOverflow = up1.maxGte(down0.max);
        const candleInHalfDown = down0.candles.some((candle) => this.lt(this.candleMax(candle), pennantBodyOffset));

        if (
            notOverflow &&
            down0.sizeLeft >= this.minSegmentSize &&
            down0.minGt(trendOffset) &&
            up2.maxLt(down0.min) &&
            candleInHalfDown
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

export class UpPennantDetect extends PennantDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP PENNANT', true, segmentService, detectorService);
    }
}

export class DownPennantDetect extends PennantDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN PENNANT', false, segmentService, detectorService);
    }
}

export class UpMidPennantDetect extends PennantDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSize = 4;
    protected maxSecondSegmentSize = 4;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP MID PENNANT', true, segmentService, detectorService);
    }
}

export class DownMidPennantDetect extends PennantDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSize = 4;
    protected maxSecondSegmentSize = 4;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN MID PENNANT', false, segmentService, detectorService);
    }
}

export class UpBigPennantDetect extends PennantDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSize = 8;
    protected maxSecondSegmentSize = 8;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP BIG PENNANT', true, segmentService, detectorService);
    }
}

export class DownBigPennantDetect extends PennantDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSize = 8;
    protected maxSecondSegmentSize = 8;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN BIG PENNANT', false, segmentService, detectorService);
    }
}
