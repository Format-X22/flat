import { AbstractDetect } from './abstract.detect';

export class RestartDetect extends AbstractDetect {
    protected enterFib = 1;
    protected takeFib = 1.8;
    protected stopFib = 0.75;

    protected minSegmentSize = 2;
    protected waitDays = 3;

    check(): boolean {
        const [down0, up1, down1, up2] = this.getWaves(4, false);

        if (!up2) {
            return;
        }

        const notOverflow = down0.maxLt(up1.max);
        const flagLikeLevel = this.getFib(up1.max, down1.min, 0.5, true);
        const minFallbackLever = this.getFib(up1.max, down0.min, 0.62, true);
        const candlesFallbackOk = down0.candles.some((candle) => this.lt(this.candleMax(candle), minFallbackLever));
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            notOverflow &&
            down0.sizeLeft >= this.minSegmentSize &&
            down1.sizeLeft >= this.minSegmentSize &&
            down1.sizeRight >= this.minSegmentSize &&
            down0.sizeLeft < up1.sizeLeft &&
            down0.minLt(flagLikeLevel) &&
            up1.maxLt(up2.max) &&
            down0.minGt(down1.min) &&
            up2.maxGt(up1.max) &&
            candlesFallbackOk &&
            highBeforeLow
        ) {
            return this.markDetection();
        } else {
            return this.markEndDetection();
        }
    }
}

export class Up extends RestartDetect {}
export class Down extends RestartDetect {}
export class UpMid extends RestartDetect {
    protected minSegmentSize = 4;
}
export class DownMid extends RestartDetect {
    protected minSegmentSize = 4;
}
export class UpBig extends RestartDetect {
    protected minSegmentSize = 8;
}
export class DownBig extends RestartDetect {
    protected minSegmentSize = 8;
}
