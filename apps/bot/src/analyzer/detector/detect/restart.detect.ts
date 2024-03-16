import { AbstractDetect } from './abstract.detect';
import { EHmaType } from '../../../data/candle.model';
import { SegmentUtil } from '../../wave/segment.util';
import { DetectorExecutor } from '../detector.executor';

export class RestartDetect extends AbstractDetect {
    protected enterFib = 0.85;
    protected takeFib = 1.8;
    protected stopFib = 0.62;

    protected minSegmentSize = 2;
    protected waitDays = 2;

    check(): boolean {
        const [down0, up1, down1, up2] = this.getWaves(4, false);

        if (!up2) {
            return;
        }

        const notOverflow = down0.maxLt(up1.max);
        const flagLikeLevel = this.getFib(up1.max, down1.min, 0.5, true);
        const minFallbackLever = this.getFib(up1.max, down0.min, 0.62, true);
        const candlesFallbackOk = down0.candles.some((candle) => this.lt(this.candleMax(candle), minFallbackLever));
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            notOverflow &&
            down0.sizeLeft >= this.minSegmentSize &&
            down0.sizeLeft < up1.sizeLeft &&
            down0.minLt(flagLikeLevel) &&
            up1.maxLt(up2.max) &&
            down0.minGt(down1.min) &&
            up2.maxGt(up1.max) &&
            candlesFallbackOk &&
            highBeforeLow
        ) {
            return this.markDetection();
        } else {
            return this.markEndDetection();
        }
    }
}

export class Up extends RestartDetect {
    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP RESTART', true, segmentUtil, detectorExecutor);
    }
}

export class Down extends RestartDetect {
    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN RESTART', false, segmentUtil, detectorExecutor);
    }
}

export class UpMid extends RestartDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSize = 4;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP MID RESTART', true, segmentUtil, detectorExecutor);
    }
}

export class DownMid extends RestartDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSize = 4;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN MID RESTART', false, segmentUtil, detectorExecutor);
    }
}

export class UpBig extends RestartDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSize = 8;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('UP BIG RESTART', true, segmentUtil, detectorExecutor);
    }
}

export class DownBig extends RestartDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSize = 8;

    constructor(segmentUtil: SegmentUtil, detectorExecutor: DetectorExecutor) {
        super('DOWN BIG RESTART', false, segmentUtil, detectorExecutor);
    }
}
