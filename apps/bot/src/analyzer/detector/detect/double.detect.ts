import { AbstractDetect } from './abstract.detect';
import { EHmaType } from '../../../data/candle.model';
import { SegmentUtil } from '../../wave/segment.util';
import { DetectorExecutor } from '../detector.executor';

export class DoubleDetect extends AbstractDetect {
    protected enterFib = 0.85;
    protected takeFib = 2;
    protected stopFib = 0.62;

    protected minSegmentSize = 2;
    protected maxSecondSegmentSize = 2;
    protected waitDays = 2;

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
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            notOverflow &&
            down0.sizeLeft >= this.minSegmentSize &&
            down1.minGt(trendOffsetFirst) &&
            up3.maxLt(down0.min) &&
            candleInHalfDownSecond &&
            up1.maxGt(up2.max) &&
            down0.minGt(down1.min) &&
            down0.minLt(up2.max) &&
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

export class Up extends DoubleDetect {
    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP DOUBLE', true, segmentUtil, detectorExecutor);
    }
}

export class Down extends DoubleDetect {
    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN DOUBLE', false, segmentUtil, detectorExecutor);
    }
}

export class UpMid extends DoubleDetect {
    protected hmaType = EHmaType.MID_HMA;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP MID DOUBLE', true, segmentUtil, detectorExecutor);
    }
}

export class DownMid extends DoubleDetect {
    protected hmaType = EHmaType.MID_HMA;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN MID DOUBLE', false, segmentUtil, detectorExecutor);
    }
}

export class UpBig extends DoubleDetect {
    protected hmaType = EHmaType.BIG_HMA;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP BIG DOUBLE', true, segmentUtil, detectorExecutor);
    }
}

export class DownBig extends DoubleDetect {
    protected hmaType = EHmaType.BIG_HMA;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN BIG DOUBLE', false, segmentUtil, detectorExecutor);
    }
}
