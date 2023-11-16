import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { EHmaType } from '../../../data/candle.model';
import { Wave } from '../../wave/wave.util';

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

        if (
            down0.minLt(down1.min) &&
            down2.minLt(down1.min) &&
            up2.maxGt(up1.max) &&
            down1.minGt(zigzagMinMove) &&
            anyCandleUnderOffset &&
            up2.sizeLeft >= this.minSegmentSize &&
            up2.sizeRight >= this.minSegmentSize &&
            down0.size < (down1.size + down2.size) / 2
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

export class UpZigzagDetect extends ZigzagDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP ZIGZAG', true, segmentService, detectorService);
    }
}

export class DownZigzagDetect extends ZigzagDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN ZIGZAG', false, segmentService, detectorService);
    }
}

export class UpMidZigzagDetect extends ZigzagDetect {
    protected hmaType = EHmaType.MID_HMA;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP MID ZIGZAG', true, segmentService, detectorService);
    }
}

export class DownMidZigzagDetect extends ZigzagDetect {
    protected hmaType = EHmaType.MID_HMA;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN MID ZIGZAG', false, segmentService, detectorService);
    }
}

export class UpBigZigzagDetect extends ZigzagDetect {
    protected hmaType = EHmaType.BIG_HMA;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP BIG ZIGZAG', true, segmentService, detectorService);
    }
}

export class DownBigZigzagDetect extends ZigzagDetect {
    protected hmaType = EHmaType.BIG_HMA;

    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN BIG ZIGZAG', false, segmentService, detectorService);
    }
}
