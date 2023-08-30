import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { EHmaType } from '../../loader/candle.model';

export class RestartDetect extends AbstractDetect {
    protected profitMul = 2;
    protected enterFib = 1;
    protected takeFib = 2;
    protected stopFib = 0.73;

    protected minSegmentSize = 2;
    protected waitDays = 2;

    check(): boolean {
        const [down0, up1, down1, up2] = this.getWaves(4, false);

        if (!up2) {
            return;
        }

        const notOverflow = down0.maxLt(up1.max);
        const flagLikeLevel = this.getFib(up1.max, down1.min, 0.5, true);
        const minFallbackLever = this.getFib(up1.max, down0.min, 0.73, true);
        const candlesFallbackOk = down0.candles.some((candle) => this.lt(this.candleMax(candle), minFallbackLever));

        if (
            notOverflow &&
            down0.sizeLeft >= this.minSegmentSize &&
            down0.sizeLeft < up1.sizeLeft &&
            down0.minLt(flagLikeLevel) &&
            up1.maxLt(up2.max) &&
            down0.minGt(down1.min) &&
            up2.maxGt(up1.max) &&
            candlesFallbackOk
        ) {
            return this.markDetection();
        } else {
            return this.markEndDetection();
        }
    }
}

export class UpRestartDetect extends RestartDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP RESTART', true, segmentService, detectorService);
    }
}

export class DownRestartDetect extends RestartDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN RESTART', false, segmentService, detectorService);
    }
}

export class UpMidRestartDetect extends RestartDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSize = 4;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP MID RESTART', true, segmentService, detectorService);
    }
}

export class DownMidRestartDetect extends RestartDetect {
    protected hmaType = EHmaType.MID_HMA;
    protected minSegmentSize = 4;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN MID RESTART', false, segmentService, detectorService);
    }
}

export class UpBigRestartDetect extends RestartDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSize = 6;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP BIG RESTART', true, segmentService, detectorService);
    }
}

export class DownBigRestartDetect extends RestartDetect {
    protected hmaType = EHmaType.BIG_HMA;
    protected minSegmentSize = 6;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN BIG RESTART', false, segmentService, detectorService);
    }
}
