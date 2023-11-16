import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';
import { Wave } from '../../wave/wave.util';

export class BreakDetect extends AbstractDetect {
    private lastDetectedAndOverflowWave: Wave;

    protected enterFib = 0.85;
    protected takeFib = 2;
    protected stopFib = 0.62;

    protected waitDays = 4;

    constructor(name: string, isNotInverted = true, segmentService: SegmentService, detectorService: DetectorService) {
        super(name, isNotInverted, segmentService, detectorService);
        this.init();
    }

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

        if (down0.minLt(down1.min) && up1.maxLt(up2.max) && down1.minGt(lastWaveOffset) && anyCandleUnderOffset) {
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

export class UpBreakDetect extends BreakDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP BREAK', true, segmentService, detectorService);
    }
}

export class DownBreakDetect extends BreakDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN BREAK', false, segmentService, detectorService);
    }
}
