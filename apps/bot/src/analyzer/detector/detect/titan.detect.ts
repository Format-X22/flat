import { AbstractDetect } from './abstract.detect';
import { Wave } from '../../wave/wave.util';

export class TitanDetect extends AbstractDetect {
    //private lastDetectedAndOverflowWave: Wave;

    protected enterFib = 0.62;
    protected takeFib = 1.43;
    protected stopFib = 0.33;

    protected waitDays = 2;
    protected minSegmentSize = 1;

    check(): boolean {
        const [down0, up1, down1, up2, down2] = this.getWaves(5, false);

        if (!down2) {
            return;
        }

        // const isAlreadyFailInMove = this.lastDetectedAndOverflowWave?.startDate === down0.startDate;

        /*if (isAlreadyFailInMove) {
            return this.markEndDetection();
        }*/

        const zigzagOffset = this.getFib(up1, down0, 0.6);
        const zigzagEnter = this.getFib(up1, down0, this.enterFib);
        //const zigzagMinMove = this.getFib(up1, down0, 0.33);
        const notOverflow = this.lt(this.candleMax(this.getCandle()), zigzagEnter);
        const anyCandleUnderOffset = down0.candles.some((candle) => this.lt(this.candleMax(candle), zigzagOffset));
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            down0.minLt(down1.min) &&
            down2.minLt(down1.min) &&
            up2.maxGt(up1.max) &&
            //down1.minGt(zigzagMinMove) &&
            anyCandleUnderOffset &&
            up2.sizeLeft >= this.minSegmentSize &&
            up2.sizeRight >= this.minSegmentSize &&
            down0.size < (down1.size + down2.size) / 2 &&
            Math.abs(up2.max - down2.min) / Math.abs(up2.max - down1.min) < 3 &&
            highBeforeLow
        ) {
            if (notOverflow) {
                return this.markDetection();
            } else {
                //this.lastDetectedAndOverflowWave = down0;
                return this.markEndDetection();
            }
        } else {
            return this.markEndDetection();
        }
    }
}

export class Up_3 extends TitanDetect {}
export class Down_3 extends TitanDetect {}
export class Up_5 extends TitanDetect {}
export class Down_5 extends TitanDetect {}
export class Up_7 extends TitanDetect {}
export class Down_7 extends TitanDetect {}
export class Up_9 extends TitanDetect {}
export class Down_9 extends TitanDetect {}
export class Up_14 extends TitanDetect {}
export class Down_14 extends TitanDetect {}
export class Up_21 extends TitanDetect {}
export class Down_21 extends TitanDetect {}
export class Up_30 extends TitanDetect {}
export class Down_30 extends TitanDetect {}
export class Up_45 extends TitanDetect {}
export class Down_45 extends TitanDetect {}
export class Up_60 extends TitanDetect {}
export class Down_60 extends TitanDetect {}
export class Up_100 extends TitanDetect {}
export class Down_100 extends TitanDetect {}
