import { AbstractDetect } from './abstract.detect';
import { Wave } from '../../wave/wave.util';

export class BreakDetect extends AbstractDetect {
    private lastDetectedAndOverflowWave: Wave;

    protected enterFib = 0.62;
    protected takeFib = 2;
    protected stopFib = 0.33;
    protected minSegmentSize = 1;

    protected waitDays = 3;

    check(): boolean {
        const [down0, up1, down1, up2, down2, up3] = this.getWaves(6, false);

        if (!up2) {
            return;
        }

        const isAlreadyFailInMove = this.lastDetectedAndOverflowWave?.startDate === down0.startDate;

        if (isAlreadyFailInMove) {
            return this.markEndDetection();
        }

        const breakOffset = this.getFib(up1, down0, 0.5);
        const breakEnter = this.getFib(up1, down0, this.enterFib);
        const lastWaveOffset = this.getFib(up1, down0, 0.25);
        const notOverflow = this.lt(this.candleMax(this.getCandle()), breakEnter);
        const anyCandleUnderOffset = down0.candles.some((candle) => this.lt(this.candleMax(candle), breakOffset));
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            down0.minLt(down1.min) &&
            up1.maxLt(up2.max) &&
            (up2.maxGt(up3.max) || up1.maxLt(down2.min)) &&
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

export class Up extends BreakDetect {}
export class Down extends BreakDetect {}
