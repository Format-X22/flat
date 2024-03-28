import { CandleModel, EHmaType } from '../../../data/candle.model';
import { TSegment } from '../../wave/segment.dto';
import { TOrder } from '../detector.dto';
import { Duration } from 'luxon';
import { Wave } from '../../wave/wave.util';
import { SegmentUtil } from '../../wave/segment.util';
import { DetectorExecutor } from '../detector.executor';
import { InversionUtil } from '../../../utils/inversion.util';
import { ReportUtil } from '../../report/report.util';
import { EReportItemType, ESide, ESize } from '../../report/report.dto';

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

    private readonly inversion: InversionUtil;

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

    private reportSide: ESide;
    private reportSize: ESize;
    private reportRiskReward: number;

    constructor(
        protected detectorExecutor: DetectorExecutor,
        protected segmentUtil: SegmentUtil,
        private reportUtil: ReportUtil,
    ) {
        const className: string = this.constructor.name;
        const detectorName: string = Object.getPrototypeOf(Object.getPrototypeOf(this)).constructor.name;

        this.name = className + detectorName.replace('Detect', '');
        this.isNotInverted = className.includes('Up');

        if (this.name.includes('Mid')) {
            this.hmaType = EHmaType.MID_HMA;
            this.reportSize = ESize.MID;
        } else if (this.name.includes('Big')) {
            this.hmaType = EHmaType.BIG_HMA;
            this.reportSize = ESize.BIG;
        } else {
            this.hmaType = EHmaType.HMA;
            this.reportSize = ESize.SMALL;
        }

        this.inversion = new InversionUtil(this.isNotInverted);

        if (this.isNotInverted) {
            this.reportSide = ESide.UP;
        } else {
            this.reportSide = ESide.DOWN;
        }
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
                        this.reportZeroFailTrade();
                        break;
                    }
                }
            }

            if (this.order.isActive) {
                for (const innerCandle of innerCandles) {
                    if (this.lte(this.candleMin(innerCandle), this.order.stop)) {
                        this.addFailToCapital();
                        this.exitPosition();
                        this.reportFailTrade();
                        break;
                    }

                    if (this.gt(this.candleMax(innerCandle), this.order.take)) {
                        this.addProfitToCapital();
                        this.exitPosition();
                        this.reportProfitTrade();
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
                        this.reportFailTrade();
                        break;
                    } else if (this.gt(this.candleMax(innerCandle), this.order.take)) {
                        this.addProfitToCapital();
                        this.exitPosition();
                        this.reportProfitTrade();
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
                    let concurrentDetectorNames;

                    if (isUp) {
                        concurrentDetectorNames = upOrderOrigin.name;
                    } else {
                        concurrentDetectorNames = downOrderOrigin.name;
                    }

                    this.reportUtil.add({
                        type: EReportItemType.CONCURRENT_ORDER,
                        detectorName: this.name,
                        concurrentName: concurrentDetectorNames,
                        timestamp: this.getCandle().timestamp,
                        side: this.reportSide,
                        size: this.reportSize,
                    });
                }
            }

            if (
                !this.detectorExecutor.isInPosition() &&
                isNoConcurrentOrders &&
                this.constLt((enterFibPrice / 100) * this.minStopOffsetSize, this.diff(enterFibPrice, stopFibPrice))
            ) {
                if (!this.order.isActive) {
                    this.reportUtil.add({
                        type: EReportItemType.PLACE_ORDER,
                        detectorName: this.name,
                        timestamp: this.getCandle().timestamp,
                        side: this.reportSide,
                        size: this.reportSize,
                        riskReward: this.reportRiskReward,
                    });
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
            this.reportCancelTrade();
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

        this.inversion.fn(
            () => this.detectorExecutor.removeUpOrder(this),
            () => this.detectorExecutor.removeDownOrder(this),
        );
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
        return this.inversion.value(segment.isUp, segment.isDown);
    }

    protected isSegmentDown(segment: TSegment): boolean {
        return this.inversion.value(segment.isDown, segment.isUp);
    }

    protected max(segmentA: TSegment, segmentB: TSegment): number {
        return this.inversion.fn(
            () => Math.max(segmentA.max, segmentB.max),
            () => Math.min(segmentA.min, segmentB.min),
        );
    }

    protected min(segmentA: TSegment, segmentB: TSegment): number {
        return this.inversion.fn(
            () => Math.min(segmentA.min, segmentB.min),
            () => Math.max(segmentA.max, segmentB.max),
        );
    }

    protected segmentMax(segment: TSegment): number {
        return this.inversion.value(segment.max, segment.min);
    }

    protected segmentMin(segment: TSegment): number {
        return this.inversion.value(segment.min, segment.max);
    }

    protected candleMax(candle: CandleModel): number {
        return this.inversion.value(candle.high, candle.low);
    }

    protected candleMin(candle: CandleModel): number {
        if (this.isNotInverted) {
            return candle.low;
        } else {
            return candle.high;
        }
    }

    protected getFib(first: number, last: number, val: number, firstIsMax: boolean): number {
        const firstIsMaxValue = this.inversion.bool(firstIsMax);

        return this.segmentUtil.getFib(first, last, val, firstIsMaxValue);
    }

    protected gt(valA: number, valB: number): boolean {
        return this.inversion.fn(
            () => valA > valB,
            () => valA < valB,
        );
    }

    protected gte(valA: number, valB: number): boolean {
        return this.inversion.fn(
            () => valA >= valB,
            () => valA <= valB,
        );
    }

    protected lt(valA: number, valB: number): boolean {
        return this.inversion.fn(
            () => valA < valB,
            () => valA > valB,
        );
    }

    protected lte(valA: number, valB: number): boolean {
        return this.inversion.fn(
            () => valA <= valB,
            () => valA >= valB,
        );
    }

    protected diff(valA: number, valB: number): number {
        return this.inversion.fn(
            () => valA - valB,
            () => valB - valA,
        );
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
            this.reportDetection();
        }

        this.isDetected = true;

        return true;
    }

    protected markEndDetection(): boolean {
        if (this.isDetected) {
            this.reportDetectionEnd();
        }

        this.isDetected = false;

        return false;
    }

    protected reportDetection(): void {
        this.reportUtil.add({
            type: EReportItemType.DETECTED_START,
            detectorName: this.name,
            timestamp: this.getCandle().timestamp,
            side: this.reportSide,
            size: this.reportSize,
            riskReward: this.reportRiskReward,
        });
    }

    protected reportDetectionEnd(): void {
        this.reportUtil.add({
            type: EReportItemType.DETECTED_END,
            detectorName: this.name,
            timestamp: this.getCandle().timestamp,
            side: this.reportSide,
            size: this.reportSize,
        });
    }

    protected enterPosition(waitDays: number): void {
        const offset = this.getDaysRange(waitDays);

        this.isInPosition = true;
        this.detectorExecutor.enterPosition();

        this.order.enterDate = this.getCandle().dateString;
        this.order.toZeroDate = this.getCandle().timestamp + offset;

        this.reportUtil.add({
            type: EReportItemType.ENTER_POSITION,
            detectorName: this.name,
            timestamp: this.getCandle().timestamp,
            side: this.reportSide,
            size: this.reportSize,
            riskReward: this.reportRiskReward,
        });
    }

    protected exitPosition(): void {
        this.isInPosition = false;
        this.detectorExecutor.exitPosition();

        this.resetOrder();

        this.reportUtil.add({
            type: EReportItemType.EXIT_POSITION,
            detectorName: this.name,
            timestamp: this.getCandle().timestamp,
            side: this.reportSide,
            size: this.reportSize,
            riskReward: this.reportRiskReward,
        });
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

    protected reportProfitTrade(): void {
        this.reportUtil.add({
            type: EReportItemType.DEAL_PROFIT,
            detectorName: this.name,
            timestamp: this.getCandle().timestamp,
            size: this.reportSize,
            side: this.reportSide,
            riskReward: this.reportRiskReward,
            value: this.detectorExecutor.getCapital(),
        });
    }

    protected reportZeroFailTrade(): void {
        this.reportUtil.add({
            type: EReportItemType.DEAL_ZERO,
            detectorName: this.name,
            timestamp: this.getCandle().timestamp,
            size: this.reportSize,
            side: this.reportSide,
            riskReward: this.reportRiskReward,
            value: this.detectorExecutor.getCapital(),
        });
    }

    protected reportFailTrade(): void {
        this.reportUtil.add({
            type: EReportItemType.DEAL_FAIL,
            detectorName: this.name,
            timestamp: this.getCandle().timestamp,
            size: this.reportSize,
            side: this.reportSide,
            riskReward: this.reportRiskReward,
            value: this.detectorExecutor.getCapital(),
        });
    }

    protected reportCancelTrade(): void {
        this.reportUtil.add({
            type: EReportItemType.CANCEL_ORDER,
            detectorName: this.name,
            timestamp: this.getCandle().timestamp,
            size: this.reportSize,
            side: this.reportSide,
        });
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

        this.reportRiskReward = (this.profitMul - 1) * 100;

        this.reportUtil.add({
            type: EReportItemType.REWARDS,
            detectorName: this.name,
            value: this.reportRiskReward,
        });
    }
}
