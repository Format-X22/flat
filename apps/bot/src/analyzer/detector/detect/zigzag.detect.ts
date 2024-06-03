import { AbstractDetect } from './abstract.detect';
import { Wave } from '../../wave/wave.util';

export class ZigzagDetect extends AbstractDetect {
    private lastDetectedAndOverflowWave: Wave;

    protected enterFib = 0.62;
    protected takeFib = 2;
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

        const zigzagOffset = this.getFib(up1, down0, 0.5);
        const zigzagEnter = this.getFib(up1, down0, this.enterFib);
        const zigzagMinMove = this.getFib(up1, down0, 0.33);
        const notOverflow = this.getCandle().high < zigzagEnter;
        const anyCandleUnderOffset = down0.candles.some((candle) => candle.high < zigzagOffset);
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            down0.min < down1.min &&
            down2.min < down1.min &&
            up2.max > up1.max &&
            down1.min > zigzagMinMove &&
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

export class Up extends ZigzagDetect {}
export class Down extends ZigzagDetect {}
export class UpMid extends ZigzagDetect {}
export class DownMid extends ZigzagDetect {}
export class UpBig extends ZigzagDetect {}
export class DownBig extends ZigzagDetect {}
