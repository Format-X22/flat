import { AbstractDetect } from './abstract.detect';
import { EHmaType } from '../../../data/candle.model';
import { Wave } from '../../wave/wave.util';
import { SegmentUtil } from '../../wave/segment.util';
import { DetectorExecutor } from '../detector.executor';

export class ZigzagDetect extends AbstractDetect {
    private lastDetectedAndOverflowWave: Wave;

    protected enterFib = 0.62;
    protected takeFib = 1.8;
    protected stopFib = 0.33;

    protected waitDays = 4;
    protected minSegmentSize = 2;

    check(): boolean {
        const [down0, up1, down1, up2, down2] = this.getWaves(5, false);

        if (!down2) {
            return;
        }

        const isAlreadyFailInMove = this.lastDetectedAndOverflowWave?.startDate === down0.startDate;

        if (isAlreadyFailInMove) {
            return this.markEndDetection();
        }

        const zigzagOffset = this.getFib(up1.max, down0.min, 0.5, true);
        const zigzagEnter = this.getFib(up1.max, down0.min, this.enterFib, true);
        const zigzagMinMove = this.getFib(up1.max, down0.min, 0.25, true);
        const notOverflow = this.lt(this.candleMax(this.getCandle()), zigzagEnter);
        const anyCandleUnderOffset = down0.candles.some((candle) => this.lt(this.candleMax(candle), zigzagOffset));
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            down0.minLt(down1.min) &&
            down2.minLt(down1.min) &&
            up2.maxGt(up1.max) &&
            down1.minGt(zigzagMinMove) &&
            anyCandleUnderOffset &&
            up2.sizeLeft >= this.minSegmentSize &&
            up2.sizeRight >= this.minSegmentSize &&
            down0.size < (down1.size + down2.size) / 2 &&
            highBeforeLow
        ) {
            if (notOverflow) {
                return this.markDetection();
            } else {
                this.lastDetectedAndOverflowWave = down0;
                return this.markEndDetection();
            }
        } else {
            return this.markEndDetection();
        }
    }
}

export class Up extends ZigzagDetect {
    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP ZIGZAG', true, segmentUtil, detectorExecutor);
    }
}

export class Down extends ZigzagDetect {
    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN ZIGZAG', false, segmentUtil, detectorExecutor);
    }
}

export class UpMid extends ZigzagDetect {
    protected hmaType = EHmaType.MID_HMA;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP MID ZIGZAG', true, segmentUtil, detectorExecutor);
    }
}

export class DownMid extends ZigzagDetect {
    protected hmaType = EHmaType.MID_HMA;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN MID ZIGZAG', false, segmentUtil, detectorExecutor);
    }
}

export class UpBig extends ZigzagDetect {
    protected hmaType = EHmaType.BIG_HMA;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP BIG ZIGZAG', true, segmentUtil, detectorExecutor);
    }
}

export class DownBig extends ZigzagDetect {
    protected hmaType = EHmaType.BIG_HMA;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN BIG ZIGZAG', false, segmentUtil, detectorExecutor);
    }
}
