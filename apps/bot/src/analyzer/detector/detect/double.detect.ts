import { AbstractDetect } from './abstract.detect';

export class DoubleDetect extends AbstractDetect {
    protected enterFib = 0.85;
    protected takeFib = 2;
    protected stopFib = 0.62;

    protected minSegmentSize = 2;
    protected maxSecondSegmentSize = 1;
    protected waitDays = 2;

    check(): boolean {
        const [down0, up1, down1, up2, down2, up3] = this.getWaves(6, false);

        if (!down2) {
            return;
        }

        const notOverflow = up1.max >= down0.max;
        const trendOffsetFirst = this.getFib(up2, down2, 0.4);
        const pennantBodyOffsetSecond = this.getFib(up1, down0, 0.5);
        const candleInHalfDownSecond = down0.candles.some((candle) => candle.high < pennantBodyOffsetSecond);
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            notOverflow &&
            down0.sizeLeft >= this.minSegmentSize &&
            down1.min > trendOffsetFirst &&
            up3.max < down0.min &&
            candleInHalfDownSecond &&
            up1.max > up2.max &&
            down0.min > down1.min &&
            down0.min < up2.max &&
            highBeforeLow
        ) {
            if (this.getCurrentSegment().isDown || down0.sizeRight < this.maxSecondSegmentSize) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        } else {
            return this.markEndDetection();
        }
    }
}

export class Up extends DoubleDetect {}
export class Down extends DoubleDetect {}
export class UpMid extends DoubleDetect {}
export class DownMid extends DoubleDetect {}
export class UpBig extends DoubleDetect {}
export class DownBig extends DoubleDetect {}
