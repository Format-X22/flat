import { AbstractDetect } from './abstract.detect';

export class FlagDetect extends AbstractDetect {
    protected enterFib = 1;
    protected takeFib = 2.5;
    protected stopFib = 0.75;

    protected minSegmentSize = 2;
    protected maxSecondSegmentSize = 2;
    protected waitDays = 2;

    check(): boolean {
        const [down0, up1, down1, up2] = this.getWaves(4, false);

        if (!up2) {
            return;
        }

        const trendOffset = this.getFib(up1, down1, 0.5);
        const flagBodyOffset = this.getFib(up1, down0, 0.5);
        const notOverflow = up1.maxGte(down0.max);
        const candleNotInHalfDown = down0.candles.every((candle) => this.gt(this.candleMax(candle), flagBodyOffset));
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            notOverflow &&
            down0.sizeLeft >= this.minSegmentSize &&
            down0.minGt(trendOffset) &&
            up2.maxLt(down0.min) &&
            candleNotInHalfDown &&
            highBeforeLow
        ) {
            if (this.isCurrentSegmentDown() || down0.sizeRight < this.maxSecondSegmentSize) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        } else {
            return this.markEndDetection();
        }
    }
}

export class Up extends FlagDetect {}
export class Down extends FlagDetect {}
export class UpMid extends FlagDetect {
    protected minSegmentSize = 4;
}
export class DownMid extends FlagDetect {
    protected minSegmentSize = 4;
}
export class UpBig extends FlagDetect {
    protected minSegmentSize = 8;
}
export class DownBig extends FlagDetect {
    protected minSegmentSize = 8;
}
