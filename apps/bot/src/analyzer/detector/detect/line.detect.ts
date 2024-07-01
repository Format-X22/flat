import { AbstractDetect } from './abstract.detect';
import { Wave } from '../../wave/wave.util';

export class LineDetect extends AbstractDetect {
    private lastDetectedAndOverflowWave: Wave;

    protected enterFib = 1;
    protected takeFib = 1.5;
    protected stopFib = 0.75;
    protected minSegmentSize = 1;

    protected waitDays = 4;

    check(): boolean {
        const [down0, up1, down1, up2, down2, up3, down3] = this.getWaves(7, false);

        if (!down3) {
            return;
        }

        const isAlreadyFailInMove = this.lastDetectedAndOverflowWave?.startDate === down0.startDate;

        if (isAlreadyFailInMove) {
            return this.markEndDetection();
        }

        const breakEnter = this.getFib(up1, down0, this.enterFib);
        const notOverflow = this.lt(this.candleMax(this.getCandle()), breakEnter);
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            down0.minLt(down1.min) &&
            up1.maxLt(up2.max) &&
            down1.minLt(down2.min) &&
            up2.maxLt(up3.max) &&
            down2.minLt(down3.min) &&
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

export class Up extends LineDetect {}
export class Down extends LineDetect {}
export class UpMid extends LineDetect {}
export class DownMid extends LineDetect {}
export class UpBig extends LineDetect {}
export class DownBig extends LineDetect {}
