import { CandleModel, EHmaType } from '../../../data/candle.model';
import { TSegment } from '../../wave/segment.dto';
import { Logger } from '@nestjs/common';
import { TOrder } from '../detector.dto';
import { Duration } from 'luxon';
import { Wave } from '../../wave/wave.util';
import { config } from '../../../bot.config';
import { SegmentUtil } from '../../wave/segment.util';
import { DetectorExecutor } from '../detector.executor';

const STOP_OFFSET = 1.5;
const COMM_OFFSET = 0.25;

export abstract class AbstractDetect {
    public readonly name: string;
    protected readonly isNotInverted: boolean;

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

    protected hmaType: EHmaType;
    protected readonly waitDays;
    protected readonly enterFib;
    protected readonly takeFib;
    protected readonly stopFib;

    constructor(protected segmentUtil: SegmentUtil, protected detectorExecutor: DetectorExecutor) {
        const className: string = this.constructor.name;
        const detectorName: string = Object.getPrototypeOf(Object.getPrototypeOf(this)).constructor.name;

        this.name = className + detectorName.replace('Detect', '');
        this.isNotInverted = className.includes('Up');

        if (this.name.includes('Mid')) {
            this.hmaType = EHmaType.MID_HMA;
        } else if (this.name.includes('Big')) {
            this.hmaType = EHmaType.BIG_HMA;
        } else {
            this.hmaType = EHmaType.HMA;
        }

        this.logger = new Logger(this.name);
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
            const isConcurrentUpOrder = this.detectorExecutor.isConcurrentUpOrder(this);
            const upOrderOrigin = this.detectorExecutor.getUpOrderOrigin();
            const downOrderOrigin = this.detectorExecutor.getDownOrderOrigin();
            const isConcurrentDownOrder = this.detectorExecutor.isConcurrentDownOrder(this);
            const isNoConcurrentOrders = (isUp && !isConcurrentUpOrder) || (!isUp && !isConcurrentDownOrder);

            if (!isNoConcurrentOrders) {
                if (!this.detectorExecutor.isSilent) {
                    /*this.logger.verbose(
                        `Concurrent order - ${this.getPrettyDate()} - ${upOrderOrigin?.name} | ${
                            downOrderOrigin?.name
                        }`,
                    );*/
                }
            }

            if (
                !this.detectorExecutor.isInPosition() &&
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
                    this.detectorExecutor.addUpOrder(this);
                } else {
                    this.detectorExecutor.addDownOrder(this);
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
            this.detectorExecutor.removeUpOrder(this);
        } else {
            this.detectorExecutor.removeDownOrder(this);
        }
    }

    protected getCandle(): CandleModel {
        return this.segmentUtil.getCurrentCandle();
    }

    protected getInnerCandles(): Array<CandleModel> {
        return this.segmentUtil.getCurrentInnerCandles();
    }

    protected getPrettyDate(): string {
        return this.getCandle().dateString;
    }

    protected getCurrentSegment(): TSegment {
        return this.getSegments(1)[0];
    }

    protected getSegments(count: number): Array<TSegment> {
        return this.segmentUtil.getSegments(count, this.hmaType);
    }

    protected getWaves(count: number, firstIsUp: boolean): Array<Wave> {
        const required = count * 2;
        const segments = this.getSegments(required);

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

    protected isCurrentSegmentUp(): boolean {
        return this.isSegmentUp(this.getCurrentSegment());
    }

    protected isCurrentSegmentDown(): boolean {
        return this.isSegmentDown(this.getCurrentSegment());
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

        return this.segmentUtil.getFib(first, last, val, firstIsMaxValue);
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
        const offset = this.getDaysRange(waitDays);

        this.isInPosition = true;
        this.detectorExecutor.enterPosition();

        this.order.enterDate = this.getCandle().dateString;
        this.order.toZeroDate = this.getCandle().timestamp + offset;

        config.logSim && this.logger.verbose(`> Enter position - ${this.getPrettyDate()}`);
    }

    protected exitPosition(): void {
        this.isInPosition = false;
        this.detectorExecutor.exitPosition();

        this.resetOrder();

        //this.logger.log(`< Exit position - ${this.getPrettyDate()}`);
    }

    protected mulCapital(value: number): void {
        this.detectorExecutor.mulCapital(value);
    }

    protected addFailToCapital(): void {
        this.mulCapital(this.failMul);
        this.detectorExecutor.addFailCount();
    }

    protected addZeroFailToCapital(): void {
        this.mulCapital(this.zeroFailMul);
        this.detectorExecutor.addZeroCount();
    }

    protected addProfitToCapital(): void {
        this.mulCapital(this.profitMul);
        this.detectorExecutor.addProfitCount();
    }

    protected getPrettyCapital(): string {
        return this.detectorExecutor.getPrettyCapital();
    }

    protected printProfitTrade(): void {
        config.logSim && this.logger.log(`PROFIT - ${this.getPrettyCapital()} - ${this.getPrettyDate()}`);
    }

    protected printZeroFailTrade(): void {
        config.logSim && this.logger.log(`ZERO - ${this.getPrettyCapital()} - ${this.getPrettyDate()}`);
    }

    protected printFailTrade(): void {
        config.logSim && this.logger.log(`FAIL - ${this.getPrettyCapital()} - ${this.getPrettyDate()}`);
    }

    protected printCancelTrade(): void {
        //this.logger.log(`CANCEL - ${this.getPrettyDate()}`);
    }

    protected getDaysRange(count: number): number {
        return Duration.fromObject({ day: count }).toMillis();
    }

    protected debugHere(dateString: string, isNotInverted: boolean): boolean {
        return this.getPrettyDate().startsWith(dateString) && this.isNotInverted === isNotInverted;
    }

    private syncRisk(): void {
        if (this.profitMul) {
            return;
        }

        const risk = this.detectorExecutor.getRisk();

        this.failMul = (100 - risk) / 100;
        this.zeroFailMul = (100 - (risk / STOP_OFFSET) * COMM_OFFSET) / 100;

        const angle = risk / (STOP_OFFSET + COMM_OFFSET);
        const riskOffset = this.enterFib - this.stopFib;
        const rewardOffset = this.takeFib - this.enterFib;
        const riskReward = rewardOffset / riskOffset;
        const riskRewardFact = riskReward * STOP_OFFSET - COMM_OFFSET * 2;

        this.profitMul = 1 + (angle * riskRewardFact) / 100;

        config.logSim && this.logger.verbose(`Reward ${((this.profitMul - 1) * 100).toFixed()}%`);
    }
}
