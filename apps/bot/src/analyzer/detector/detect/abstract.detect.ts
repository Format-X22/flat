import { CandleModel, EHmaType } from '../../../data/candle.model';
import { SegmentService } from '../../segment/segment.service';
import { TSegment } from '../../segment/segment.dto';
import { Logger } from '@nestjs/common';
import { TOrder } from '../detector.dto';
import { Duration } from 'luxon';
import { DetectorService } from '../detector.service';
import { Wave } from '../../wave/wave.util';

const STOP_OFFSET = 1.5;
const COMM_OFFSET = 0.25;

export abstract class AbstractDetect {
    public order: TOrder = {
        isActive: false,
        enter: null,
        take: null,
        stop: null,
        enterDate: null,
        toZeroDate: null,
    };

    private readonly logger: Logger;

    protected isDetected: boolean = false;
    protected isInPosition: boolean = false;

    protected minStopOffsetSize = 1;
    private zeroFailMul;
    private failMul;
    private profitMul;

    protected hmaType: EHmaType = EHmaType.HMA;
    protected readonly waitDays;
    protected readonly enterFib;
    protected readonly takeFib;
    protected readonly stopFib;

    protected constructor(
        protected name: string,
        protected readonly isNotInverted = true,
        protected segmentService: SegmentService,
        protected detectorService: DetectorService,
    ) {
        this.logger = new Logger(name);
    }

    abstract check(): boolean;

    handleOrder(): void {
        this.syncRisk();

        const candle = this.getCandle();

        if (!this.order.isActive) {
            return;
        }

        const innerCandles = this.getInnerCandles();

        if (this.isInPosition) {
            if (this.order.toZeroDate <= candle.timestamp) {
                const enter = this.order.enter;

                for (const innerCandle of innerCandles) {
                    if (
                        (this.lte(innerCandle.open, enter) && this.gt(this.candleMax(innerCandle), enter)) ||
                        (this.gt(innerCandle.open, enter) && this.lt(this.candleMin(innerCandle), enter))
                    ) {
                        this.addZeroFailToCapital();
                        this.exitPosition();
                        this.printZeroFailTrade();
                        break;
                    }
                }
            }

            if (this.order.isActive) {
                for (const innerCandle of innerCandles) {
                    if (this.lte(this.candleMin(innerCandle), this.order.stop)) {
                        this.addFailToCapital();
                        this.exitPosition();
                        this.printFailTrade();
                        break;
                    }

                    if (this.gt(this.candleMax(innerCandle), this.order.take)) {
                        this.addProfitToCapital();
                        this.exitPosition();
                        this.printProfitTrade();
                        break;
                    }
                }
            }
        } else {
            let inPosition = false;
            let inPositionAtNow = false;

            for (const innerCandle of innerCandles) {
                inPositionAtNow = false;

                if (this.gt(this.candleMax(innerCandle), this.order.enter)) {
                    if (!inPosition) {
                        inPosition = true;
                        inPositionAtNow = true;
                        this.enterPosition(this.waitDays);
                    }
                }

                if (inPosition) {
                    if (!inPositionAtNow && this.lt(this.candleMin(innerCandle), this.order.stop)) {
                        this.addFailToCapital();
                        this.exitPosition();
                        this.printFailTrade();
                        break;
                    } else if (this.gt(this.candleMax(innerCandle), this.order.take)) {
                        this.addProfitToCapital();
                        this.exitPosition();
                        this.printProfitTrade();
                        break;
                    }
                }
            }
        }
    }

    handleTradeDetection(): void {
        if (this.isInPosition) {
            return;
        }

        if (this.isDetected) {
            const [current, prev1, prev2] = this.getSegments(3);
            let valA;
            let valB;

            if (this.isSegmentDown(current)) {
                valA = this.max(current, prev1);
                valB = this.segmentMin(current);
            } else {
                valA = this.max(prev1, prev2);
                valB = this.min(current, prev1);
            }

            const stopFibPrice = this.getFib(valA, valB, this.stopFib, true);
            const enterFibPrice = this.getFib(valA, valB, this.enterFib, true);
            const takeFibPrice = this.getFib(valA, valB, this.takeFib, true);

            const isUp = this.isNotInverted;
            const isConcurrentUpOrder = this.detectorService.isConcurrentUpOrder(this);
            const upOrderOrigin = this.detectorService.getUpOrderOrigin();
            const downOrderOrigin = this.detectorService.getDownOrderOrigin();
            const isConcurrentDownOrder = this.detectorService.isConcurrentDownOrder(this);
            const isNoConcurrentOrders = (isUp && !isConcurrentUpOrder) || (!isUp && !isConcurrentDownOrder);

            if (!isNoConcurrentOrders) {
                if (!this.detectorService.isSilent) {
                    /*this.logger.verbose(
                        `Concurrent order - ${this.getPrettyDate()} - ${upOrderOrigin?.name} | ${
                            downOrderOrigin?.name
                        }`,
                    );*/
                }
            }

            if (
                !this.detectorService.isInPosition() &&
                isNoConcurrentOrders &&
                this.candleMax(this.getCandle()) !== enterFibPrice &&
                this.constLt((enterFibPrice / 100) * this.minStopOffsetSize, this.diff(enterFibPrice, stopFibPrice))
            ) {
                if (!this.order.isActive) {
                    //this.logger.verbose(`> Place order - ${this.getPrettyDate()}`);
                }

                this.order.isActive = true;
                this.order.enter = enterFibPrice;
                this.order.take = takeFibPrice;
                this.order.stop = stopFibPrice;

                if (isUp) {
                    this.detectorService.addUpOrder(this);
                } else {
                    this.detectorService.addDownOrder(this);
                }
            }
        } else if (this.order.isActive) {
            this.resetOrder();
            this.printCancelTrade();
        }
    }

    resetOrderIfNoPosition(): void {
        if (this.isInPosition) {
            return;
        }

        this.resetOrder();
    }

    resetOrder(): void {
        this.order.isActive = false;
        this.order.enter = null;
        this.order.take = null;
        this.order.stop = null;
        this.order.enterDate = null;
        this.order.toZeroDate = null;

        if (this.isNotInverted) {
            this.detectorService.removeUpOrder(this);
        } else {
            this.detectorService.removeDownOrder(this);
        }
    }

    protected getCandle(): CandleModel {
        return this.segmentService.getCurrentCandle();
    }

    protected getInnerCandles(): Array<CandleModel> {
        return this.segmentService.getCurrentInnerCandles();
    }

    protected getPrettyDate(): string {
        return this.getCandle().dateString;
    }

    protected getCurrentSegment(): TSegment {
        return this.getSegments(1)[0];
    }

    protected getSmallCurrentSegment(): TSegment {
        return this.getSmallSegments(1)[0];
    }

    protected getSegments(count: number): Array<TSegment> {
        return this.segmentService.getSegments(count, this.hmaType);
    }

    protected getSmallSegments(count: number): Array<TSegment> {
        return this.segmentService.getSmallSegments(count, this.hmaType);
    }

    protected getWaves(count: number, firstIsUp: boolean, small = false): Array<Wave> {
        const required = count * 2;
        let segments;

        if (small) {
            segments = this.getSmallSegments(required);
        } else {
            segments = this.getSegments(required);
        }

        if (!segments[required - 1]) {
            return new Array(required);
        }

        const current = segments[0];
        const waves = [];

        if ((firstIsUp && this.isSegmentUp(current)) || (!firstIsUp && !this.isSegmentUp(current))) {
            waves.push(new Wave(current, null, this.isNotInverted));
        }

        for (let i = 0; i < required - 1; i++) {
            waves.push(new Wave(segments[i + 1], segments[i], this.isNotInverted));
        }

        return waves;
    }

    protected getSmallWaves(count: number, firstIsUp: boolean): Array<Wave> {
        return this.getWaves(count, firstIsUp, true);
    }

    protected isCurrentSegmentUp(): boolean {
        return this.isSegmentUp(this.getCurrentSegment());
    }

    protected isCurrentSegmentDown(): boolean {
        return this.isSegmentDown(this.getCurrentSegment());
    }

    protected isSmallCurrentSegmentUp(): boolean {
        return this.isSegmentUp(this.getSmallCurrentSegment());
    }

    protected isSmallCurrentSegmentDown(): boolean {
        return this.isSegmentDown(this.getSmallCurrentSegment());
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

    protected concat(segmentA: TSegment, segmentB: TSegment, segmentC: TSegment): TSegment {
        let min = Math.min(segmentA.min, segmentB.min, segmentC.min);
        let max = Math.max(segmentA.max, segmentB.max, segmentC.max);

        if (!this.isNotInverted) {
            [min, max] = [max, min];
        }

        return {
            isUp: segmentA.isUp,
            isDown: segmentA.isDown,
            size: segmentA.size + segmentB.size + segmentC.size,
            min,
            max,
            startDate: segmentA.startDate,
            endDate: segmentC.endDate,
            candles: [...segmentA.candles, ...segmentB.candles, ...segmentC.candles],
        };
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
        //this.logger.verbose(this.getCandle().dateString);
    }

    protected printDetectionEnd(): void {
        //this.logger.verbose('<< ' + this.getCandle().dateString);
    }

    protected enterPosition(waitDays: number): void {
        this.isInPosition = true;
        this.detectorService.enterPosition();

        this.order.enterDate = this.getCandle().dateString;
        this.order.toZeroDate = this.getCandle().timestamp + this.getDaysRange(waitDays);

        this.logger.verbose(`> Enter position - ${this.getPrettyDate()}`);
    }

    protected exitPosition(): void {
        this.isInPosition = false;
        this.detectorService.exitPosition();

        this.resetOrder();

        //this.logger.log(`< Exit position - ${this.getPrettyDate()}`);
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
        //this.logger.log(`CANCEL - ${this.getPrettyDate()}`);
    }

    protected getDaysRange(count: number): number {
        return Duration.fromObject({ day: count }).toMillis();
    }

    protected getWeekRange(count: number): number {
        return Duration.fromObject({ day: count * 7 }).toMillis();
    }

    protected get4hRange(count: number): number {
        return Duration.fromObject({ hours: count * 4 }).toMillis();
    }

    protected debugHere(dateString: string, isNotInverted: boolean): boolean {
        return this.getPrettyDate().startsWith(dateString) && this.isNotInverted === isNotInverted;
    }

    private syncRisk(): void {
        if (this.profitMul) {
            return;
        }

        const risk = this.detectorService.getRisk();

        this.failMul = (100 - risk) / 100;
        this.zeroFailMul = (100 - (risk / STOP_OFFSET) * COMM_OFFSET) / 100;

        const angle = risk / (STOP_OFFSET + COMM_OFFSET);
        const riskOffset = this.enterFib - this.stopFib;
        const rewardOffset = this.takeFib - this.enterFib;
        const riskReward = rewardOffset / riskOffset;
        const riskRewardFact = riskReward * STOP_OFFSET - COMM_OFFSET * 2;

        this.profitMul = 1 + (angle * riskRewardFact) / 100;

        this.logger.verbose(`Reward ${((this.profitMul - 1) * 100).toFixed()}%`);
    }
}
