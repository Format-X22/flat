import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { Wave } from '../../wave/wave.util';

export class BreakDetect extends AbstractDetect {
    private lastDetectedAndOverflowWave: Wave;

    protected enterFib = 0.62;
    protected takeFib = 2;
    protected stopFib = 0.33;
    protected minSegmentSize = 2;

    protected waitDays = 3;

    check(): boolean {
        const [down0, up1, down1, up2] = this.getWaves(4, false);

        if (!up2) {
            return;
        }

        const isAlreadyFailInMove = this.lastDetectedAndOverflowWave?.startDate === down0.startDate;

        if (isAlreadyFailInMove) {
            return this.markEndDetection();
        }

        const breakOffset = this.getFib(up1.max, down0.min, 0.5, true);
        const breakEnter = this.getFib(up1.max, down0.min, this.enterFib, true);
        const lastWaveOffset = this.getFib(up1.max, down0.min, 0.25, true);
        const notOverflow = this.lt(this.candleMax(this.getCandle()), breakEnter);
        const anyCandleUnderOffset = down0.candles.some((candle) => this.lt(this.candleMax(candle), breakOffset));
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            down0.minLt(down1.min) &&
            up1.maxLt(up2.max) &&
            down1.minGt(lastWaveOffset) &&
            anyCandleUnderOffset &&
            up1.sizeLeft >= this.minSegmentSize &&
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

export class Up extends BreakDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP BREAK', true, segmentService, detectorService);
    }
}

export class Down extends BreakDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN BREAK', false, segmentService, detectorService);
    }
}
