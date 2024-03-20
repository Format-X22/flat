import { AbstractDetect } from './abstract.detect';

export class TriangleDetect extends AbstractDetect {
    protected enterFib = 1;
    protected takeFib = 1.75;
    protected stopFib = 0.5;

    protected waitDays = 4;
    protected minSegmentSize = 2;

    check(): boolean {
        const [down0, up1, down1, up2, down2] = this.getWaves(5, false);

        if (!down2) {
            return;
        }

        const notOverflow = down0.maxLt(up1.max);
        const triangleOffset = this.getFib(up1.max, down2.min, 0.5, true);
        const highBeforeLow = up1.maxCandle.timestamp <= down0.minCandle.timestamp;

        if (
            notOverflow &&
            down0.minGt(down1.min) &&
            down1.minGt(down2.min) &&
            up1.maxLt(up2.max) &&
            down1.minLt(triangleOffset) &&
            down1.sizeLeft >= this.minSegmentSize &&
            down1.sizeRight >= this.minSegmentSize &&
            highBeforeLow
        ) {
            return this.markDetection();
        } else {
            return this.markEndDetection();
        }
    }
}

export class Up extends TriangleDetect {}
export class Down extends TriangleDetect {}
export class UpMid extends TriangleDetect {
    protected minSegmentSize = 4;
}
export class DownMid extends TriangleDetect {
    protected minSegmentSize = 4;
}
export class UpBig extends TriangleDetect {
    protected minSegmentSize = 8;
}
export class DownBig extends TriangleDetect {
    protected minSegmentSize = 8;
}
