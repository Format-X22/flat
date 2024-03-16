import { AbstractDetect } from './abstract.detect';
import { EHmaType } from '../../../data/candle.model';
import { SegmentUtil } from '../../wave/segment.util';
import { DetectorExecutor } from '../detector.executor';

export class FlagDetect extends AbstractDetect {
    protected enterFib = 1;
    protected takeFib = 2.5;
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
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            notOverflow &&
            down0.sizeLeft >= this.minSegmentSize &&
            down0.minGt(trendOffset) &&
            up2.maxLt(down0.min) &&
            candleNotInHalfDown &&
            highBeforeLow
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

export class Up extends FlagDetect {
    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP FLAG', true, segmentUtil, detectorExecutor);
    }
}

export class Down extends FlagDetect {
    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN FLAG', false, segmentUtil, detectorExecutor);
    }
}

export class UpMid extends FlagDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSize = 4;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP MID FLAG', true, segmentUtil, detectorExecutor);
    }
}

export class DownMid extends FlagDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSize = 4;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN MID FLAG', false, segmentUtil, detectorExecutor);
    }
}

export class UpBig extends FlagDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSize = 8;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP BIG FLAG', true, segmentUtil, detectorExecutor);
    }
}

export class DownBig extends FlagDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSize = 8;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN BIG FLAG', false, segmentUtil, detectorExecutor);
    }
}
