import { CandleModel } from '../../loader/candle.model';
import { SegmentService } from '../../segment/segment.service';
import { TSegment } from '../../segment/segment.dto';
import { Logger } from '@nestjs/common';
import { TOrder } from '../detector.dto';
import { Duration } from 'luxon';
import { DetectorService } from '../detector.service';

export abstract class AbstractDetect {
    private readonly logger: Logger;

    protected isDetected: boolean = false;
    protected isInPosition: boolean = false;
    protected order: TOrder = {
        isActive: false,
        enter: null,
        take: null,
        stop: null,
        enterDate: null,
        toZeroDate: null,
    };

    protected minStopOffsetSize = 1;
    private zeroFailMul = 0.95;
    private failMul = 0.66;

    protected abstract profitMul;
    protected abstract enterFib;
    protected abstract takeFib;
    protected abstract stopFib;

    protected constructor(
        private name: string,
        protected readonly isNotInverted = true,
        protected segmentService: SegmentService,
        protected detectorService: DetectorService,
    ) {
        this.logger = new Logger(name);
    }

    abstract check(): boolean;
    abstract trade(): void;

    protected getCandle(): CandleModel {
        return this.segmentService.getCurrentCandle();
    }

    protected getPrettyDate(): string {
        return this.getCandle().dateString;
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

    protected diff(valA: number, valB: number): number {
        if (this.isNotInverted) {
            return valA - valB;
        } else {
            return valB - valA;
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

    protected resetOrder(): void {
        this.order.isActive = false;
        this.order.enter = null;
        this.order.take = null;
        this.order.stop = null;
        this.order.enterDate = null;
        this.order.toZeroDate = null;
    }

    protected printDetection(): void {
        this.logger.verbose(this.getCandle().dateString);
    }

    protected printDetectionEnd(): void {
        this.logger.verbose('<< ' + this.getCandle().dateString);
    }

    protected enterPosition(waitDays: number): void {
        this.isInPosition = true;

        this.order.enterDate = this.getCandle().dateString;
        this.order.toZeroDate = this.getCandle().timestamp + this.getDaysRange(waitDays);
    }

    protected exitPosition(): void {
        this.isInPosition = false;

        this.resetOrder();
    }

    protected getCapital(): number {
        return this.detectorService.getCapital();
    }

    protected mulCapital(value: number): void {
        this.detectorService.mulCapital(value);
    }

    protected addFailToCapital(): void {
        this.mulCapital(this.failMul);
        this.detectorService.addFailCount();
    }

    protected addZeroFailToCapital(): void {
        this.mulCapital(this.zeroFailMul);
        this.detectorService.addZeroCount();
    }

    protected addProfitToCapital(): void {
        this.mulCapital(this.profitMul);
        this.detectorService.addProfitCount();
    }

    protected getPrettyCapital(): string {
        return this.detectorService.getPrettyCapital();
    }

    protected printProfitTrade(): void {
        this.logger.log(`PROFIT - ${this.getPrettyCapital()} - ${this.getPrettyDate()}`);
    }

    protected printZeroFailTrade(): void {
        this.logger.log(`ZERO - ${this.getPrettyCapital()} - ${this.getPrettyDate()}`);
    }

    protected printFailTrade(): void {
        this.logger.log(`FAIL - ${this.getPrettyCapital()} - ${this.getPrettyDate()}`);
    }

    protected printCancelTrade(): void {
        this.logger.log(`CANCEL - ${this.getPrettyDate()}`);
    }

    protected getDaysRange(count: number): number {
        return Duration.fromObject({ day: count }).toMillis();
    }

    protected handleOrder(waitDays: number): void {
        const candle = this.getCandle();

        if (this.order.isActive) {
            if (this.isInPosition) {
                if (this.constLte(this.order.toZeroDate, candle.timestamp)) {
                    const enter = this.order.enter;

                    if (
                        (this.lte(candle.open, enter) && this.gt(this.candleMax(candle), enter)) ||
                        (this.gt(candle.open, enter) && this.lt(this.candleMin(candle), enter))
                    ) {
                        this.addZeroFailToCapital();
                        this.exitPosition();
                        this.printZeroFailTrade();
                    }
                }

                if (this.order.isActive && this.gt(this.candleMax(candle), this.order.take)) {
                    this.addProfitToCapital();
                    this.exitPosition();
                    this.printProfitTrade();
                }

                if (this.order.isActive && this.lte(this.candleMin(candle), this.order.stop)) {
                    this.addFailToCapital();
                    this.exitPosition();
                    this.printFailTrade();
                }
            } else {
                if (this.gt(this.candleMax(candle), this.order.take)) {
                    this.addProfitToCapital();
                    this.enterPosition(0);
                    this.exitPosition();

                    this.printProfitTrade();
                } else if (this.gt(this.candleMax(candle), this.order.enter)) {
                    this.enterPosition(waitDays);

                    if (this.lt(this.getCandle().close, this.order.stop)) {
                        this.addFailToCapital();
                        this.exitPosition();
                        this.printFailTrade();
                    }
                }
            }
        }
    }

    protected handleTradeDetection(): void {
        if (!this.isInPosition) {
            if (this.isDetected) {
                const [current, prev1, prev2] = this.getSegments(3);
                let stopFibPrice;
                let enterFibPrice;
                let takeFibPrice;

                let valA;
                let valB;

                if (this.isSegmentDown(current)) {
                    valA = this.max(current, prev1);
                    valB = this.segmentMin(current);
                } else {
                    valA = this.max(prev1, prev2);
                    valB = this.min(current, prev1);
                }

                stopFibPrice = this.getFib(valA, valB, this.stopFib, true);
                enterFibPrice = this.getFib(valA, valB, this.enterFib, true);
                takeFibPrice = this.getFib(valA, valB, this.takeFib, true);

                if (
                    this.constLt((enterFibPrice / 100) * this.minStopOffsetSize, this.diff(enterFibPrice, stopFibPrice))
                ) {
                    this.order.isActive = true;
                    this.order.enter = enterFibPrice;
                    this.order.take = takeFibPrice;
                    this.order.stop = stopFibPrice;
                }
            } else if (this.order.isActive) {
                this.resetOrder();
                this.printCancelTrade();
            }
        }
    }
}
