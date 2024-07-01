import { AbstractDetect } from './abstract.detect';

export class LazyDetector extends AbstractDetect {
    protected enterFib = 0.62;
    protected takeFib = 1.43;
    protected stopFib = 0.33;
    protected minSegmentSize = 1;

    protected waitDays = 2;

    check(): boolean {
        const [down0, up1, down1, up2, down2, up3] = this.getWaves(6, false);

        if (!up3) {
            return;
        }

        const notOverflow = up1.maxGte(down0.max);
        const pennantBodyOffsetSecond = this.getFib(up1, down0, 0.5);
        const candleInHalfDownSecond = down0.candles.some((candle) =>
            this.lt(this.candleMax(candle), pennantBodyOffsetSecond),
        );
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            notOverflow &&
            down0.sizeLeft >= this.minSegmentSize &&
            down0.minGt(down1.min) &&
            down1.minGt(down2.min) &&
            up1.maxGt(up2.max) &&
            up2.maxGt(up3.max) &&
            candleInHalfDownSecond &&
            highBeforeLow
        ) {
            return this.markDetection();
        } else {
            return this.markEndDetection();
        }
    }
}

export class Up extends LazyDetector {}
export class Down extends LazyDetector {}
