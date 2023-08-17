import { CandleModel } from '../../loader/candle.model';
import { SegmentService } from '../../segment/segment.service';
import { TSegment } from '../../segment/segment.dto';
import { Logger } from '@nestjs/common';

export abstract class AbstractDetect {
    protected isDetected: boolean = false;
    private readonly logger: Logger;

    protected constructor(
        private name: string,
        protected readonly isNotInverted = true,
        protected segmentService: SegmentService,
    ) {
        this.logger = new Logger(name);
    }

    abstract check(): boolean;

    protected getCandle(): CandleModel {
        return this.segmentService.getCurrentCandle();
    }

    protected getSegments(count: number): Array<TSegment> {
        return this.segmentService.getSegments(count);
    }

    protected isSegmentUp(segment: TSegment): boolean {
        if (this.isNotInverted) {
            return segment.isUp;
        } else {
            return segment.isDown;
        }
    }

    protected isSegmentDown(segment: TSegment): boolean {
        if (this.isNotInverted) {
            return segment.isDown;
        } else {
            return segment.isUp;
        }
    }

    protected max(segmentA: TSegment, segmentB: TSegment): number {
        if (this.isNotInverted) {
            return Math.max(segmentA.max, segmentB.max);
        } else {
            return Math.min(segmentA.min, segmentB.min);
        }
    }

    protected min(segmentA: TSegment, segmentB: TSegment): number {
        if (this.isNotInverted) {
            return Math.min(segmentA.min, segmentB.min);
        } else {
            return Math.max(segmentA.max, segmentB.max);
        }
    }

    protected segmentMax(segment: TSegment): number {
        if (this.isNotInverted) {
            return segment.max;
        } else {
            return segment.min;
        }
    }

    protected segmentMin(segment: TSegment): number {
        if (this.isNotInverted) {
            return segment.min;
        } else {
            return segment.max;
        }
    }

    protected candleMax(candle: CandleModel): number {
        if (this.isNotInverted) {
            return candle.high;
        } else {
            return candle.low;
        }
    }

    protected candleMin(candle: CandleModel): number {
        if (this.isNotInverted) {
            return candle.low;
        } else {
            return candle.high;
        }
    }

    protected sizeGt(segment: TSegment, size: number): boolean {
        return segment.size > size;
    }

    protected getFib(first: number, last: number, val: number, firstIsMax: boolean): number {
        const firstIsMaxValue = this.isNotInverted ? firstIsMax : !firstIsMax;

        return this.segmentService.getFib(first, last, val, firstIsMaxValue);
    }

    protected gt(valA: number, valB: number): boolean {
        if (this.isNotInverted) {
            return valA > valB;
        } else {
            return valA < valB;
        }
    }

    protected gte(valA: number, valB: number): boolean {
        if (this.isNotInverted) {
            return valA >= valB;
        } else {
            return valA <= valB;
        }
    }

    protected lt(valA: number, valB: number): boolean {
        if (this.isNotInverted) {
            return valA < valB;
        } else {
            return valA > valB;
        }
    }

    protected lte(valA: number, valB: number): boolean {
        if (this.isNotInverted) {
            return valA <= valB;
        } else {
            return valA >= valB;
        }
    }

    protected constGt(valA: number, valB: number): boolean {
        return valA > valB;
    }

    protected constGte(valA: number, valB: number): boolean {
        return valA >= valB;
    }

    protected constLt(valA: number, valB: number): boolean {
        return valA < valB;
    }

    protected constLte(valA: number, valB: number): boolean {
        return valA <= valB;
    }

    protected markDetection(): boolean {
        if (!this.isDetected) {
            this.printDetection();
        }

        this.isDetected = true;

        return true;
    }

    protected markEndDetection(): boolean {
        if (this.isDetected) {
            this.printDetectionEnd();
        }

        this.isDetected = false;

        return false;
    }

    protected printDetection(): void {
        this.logger.verbose(this.getCandle().dateString);
    }

    protected printDetectionEnd(): void {
        this.logger.verbose('<< ' + this.getCandle().dateString);
    }
}
