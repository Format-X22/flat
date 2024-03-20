import { AbstractDetect } from './abstract.detect';

export class PennantDetect extends AbstractDetect {
    protected enterFib = 0.85;
    protected takeFib = 2.3;
    protected stopFib = 0.62;

    protected minSegmentSize = 2;
    protected maxSecondSegmentSize = 2;
    protected waitDays = 2;

    check(): boolean {
        const [down0, up1, down1, up2] = this.getWaves(4, false);

        if (!up2) {
            return;
        }

        const trendOffset = this.getFib(up1.max, down1.min, 0.5, true);
        const pennantBodyOffset = this.getFib(up1.max, down0.min, 0.5, true);
        const notOverflow = up1.maxGte(down0.max);
        const candleInHalfDown = down0.candles.some((candle) => this.lt(this.candleMax(candle), pennantBodyOffset));
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            notOverflow &&
            down0.sizeLeft >= this.minSegmentSize &&
            down0.minGt(trendOffset) &&
            up2.maxLt(down0.min) &&
            candleInHalfDown &&
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

export class Up extends PennantDetect {}
export class Down extends PennantDetect {}
export class UpMid extends PennantDetect {
    protected minSegmentSize = 4;
    protected maxSecondSegmentSize = 4;
}
export class DownMid extends PennantDetect {
    protected minSegmentSize = 4;
    protected maxSecondSegmentSize = 4;
}
export class UpBig extends PennantDetect {
    protected minSegmentSize = 8;
    protected maxSecondSegmentSize = 8;
}
export class DownBig extends PennantDetect {
    protected minSegmentSize = 8;
    protected maxSecondSegmentSize = 8;
}
