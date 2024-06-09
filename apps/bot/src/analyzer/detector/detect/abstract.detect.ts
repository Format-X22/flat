import { CandleModel, EHmaType } from '../../../data/candle.model';
import { TSegment } from '../../wave/segment.dto';
import { TOrder } from '../detector.dto';
import { Duration } from 'luxon';
import { Wave } from '../../wave/wave.util';
import { SegmentUtil } from '../../wave/segment.util';
import { DetectorExecutor } from '../detector.executor';
import { ReportUtil } from '../../report/report.util';
import { EReportItemType, ESide, ESize, TReportItem, TReportRewards } from '../../report/report.dto';

const STOP_OFFSET = 1.5;
const COMM_OFFSET = 0.25;

export abstract class AbstractDetect {
    public readonly name: string;
    protected readonly isUpStrategy: boolean;

    public order: TOrder = {
        isActive: false,
        enter: null,
        take: null,
        stop: null,
        enterDate: null,
        toZeroDate: null,
    };

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

    private readonly reportSide: ESide;
    private readonly reportSize: ESize;
    private reportRiskReward: number;

    constructor(
        protected detectorExecutor: DetectorExecutor,
        protected segmentUtil: SegmentUtil,
        private reportUtil: ReportUtil,
    ) {
        const className: string = this.constructor.name;
        const detectorName: string = Object.getPrototypeOf(Object.getPrototypeOf(this)).constructor.name;

        this.name = className + detectorName.replace('Detect', '');
        this.isUpStrategy = className.includes('Up');

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

        if (this.isUpStrategy) {
            this.reportSide = ESide.UP;
        } else {
            this.reportSide = ESide.DOWN;
        }
    }

    abstract check(): boolean;

    handleOrder(): void {
        this.syncRisk();

        if (!this.order.isActive) {
            return;
        }

        const candle = this.getCandle();

        if (this.isInPosition) {
            if (this.order.toZeroDate <= candle.timestamp) {
                this.handleZeroOrder();
            }

            if (this.order.isActive) {
                this.handleActiveOrder();
            }
        } else {
            this.handleOrderIfNoPosition();
        }
    }

    handleTradeDetection(): void {
        if (this.isInPosition) {
            return;
        }

        if (this.isDetected) {
            this.handleDetected();
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

        if (this.isUpStrategy) {
            this.detectorExecutor.removeUpOrder(this);
        } else {
            this.detectorExecutor.removeDownOrder(this);
        }
    }

    protected getCandle(): CandleModel {
        return this.segmentUtil.getCurrentCandle();
    }

    protected getCurrentSegment(): TSegment {
        return this.getSegments(1)[0];
    }

    protected getSegments(count: number): Array<TSegment> {
        return this.segmentUtil.getSegments(count, this.hmaType);
    }

    protected getWaves(count: number, firstIsUp: boolean): Array<Wave> {
        return Wave.getWaves(count, firstIsUp, this.isUpStrategy, this.getSegments.bind(this));
    }

    protected getFib(first: Wave, last: Wave, val: number): number {
        return this.segmentUtil.getFib(first.max, last.min, val);
    }

    protected getFibByValue(first: number, last: number, val: number): number {
        return this.segmentUtil.getFib(first, last, val);
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

    protected debugHere(dateString: string, isUpStrategy: boolean): boolean {
        return this.getPrettyDate().startsWith(dateString) && this.isUpStrategy === isUpStrategy;
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
            ...this.getReportData(EReportItemType.REWARDS),
            value: this.reportRiskReward,
        } as TReportRewards);
    }

    private getReportData(type: EReportItemType, concurrentName: string = null): TReportItem {
        return {
            type,
            detectorName: this.name,
            timestamp: this.getCandle().timestamp,
            size: this.reportSize,
            side: this.reportSide,
            riskReward: this.reportRiskReward,
            value: this.detectorExecutor.getCapital(),
            concurrentName,
        } as TReportItem;
    }

    private handleZeroOrder(): void {
        const enter = this.order.enter;

        for (const innerCandle of this.getInnerCandles()) {
            if (
                (innerCandle.open <= enter && innerCandle.high > enter) ||
                (innerCandle.open > enter && innerCandle.low < enter)
            ) {
                this.addZeroFailToCapital();
                this.exitPosition();
                this.reportZeroFailTrade();
                break;
            }
        }
    }

    private handleActiveOrder(): void {
        for (const innerCandle of this.getInnerCandles()) {
            if (innerCandle.low <= this.order.stop) {
                this.addFailToCapital();
                this.exitPosition();
                this.reportFailTrade();
                break;
            }

            if (innerCandle.high > this.order.take) {
                this.addProfitToCapital();
                this.exitPosition();
                this.reportProfitTrade();
                break;
            }
        }
    }

    private handleOrderIfNoPosition(): void {
        let inPosition = false;
        let inPositionAtNow = false;

        for (const innerCandle of this.getInnerCandles()) {
            inPositionAtNow = false;

            if (innerCandle.high > this.order.enter) {
                if (!inPosition) {
                    inPosition = true;
                    inPositionAtNow = true;
                    this.enterPosition(this.waitDays);
                }
            }

            if (inPosition) {
                if (!inPositionAtNow && innerCandle.low < this.order.stop) {
                    this.addFailToCapital();
                    this.exitPosition();
                    this.reportFailTrade();
                    break;
                } else if (innerCandle.high > this.order.take) {
                    this.addProfitToCapital();
                    this.exitPosition();
                    this.reportProfitTrade();
                    break;
                }
            }
        }
    }

    private handleDetected(): void {
        const [current, prev1, prev2] = this.getSegments(3);
        let valA;
        let valB;

        if (current.isDown) {
            valA = Math.max(current.max, prev1.max);
            valB = current.min;
        } else {
            valA = Math.max(prev1.max, prev2.max);
            valB = Math.min(current.min, prev1.min);
        }

        const stopFibPrice = this.getFibByValue(valA, valB, this.stopFib);
        const enterFibPrice = this.getFibByValue(valA, valB, this.enterFib);
        const takeFibPrice = this.getFibByValue(valA, valB, this.takeFib);

        const isUp = this.isUpStrategy;
        const isConcurrentUpOrder = this.detectorExecutor.isConcurrentUpOrder(this);
        const upOrderOrigin = this.detectorExecutor.getUpOrderOrigin();
        const downOrderOrigin = this.detectorExecutor.getDownOrderOrigin();
        const isConcurrentDownOrder = this.detectorExecutor.isConcurrentDownOrder(this);
        const isNoConcurrentOrders = (isUp && !isConcurrentUpOrder) || (!isUp && !isConcurrentDownOrder);

        if (!isNoConcurrentOrders) {
            let concurrentDetectorNames;

            if (isUp) {
                concurrentDetectorNames = upOrderOrigin.name;
            } else {
                concurrentDetectorNames = downOrderOrigin.name;
            }

            this.reportUtil.add(this.getReportData(EReportItemType.CONCURRENT_ORDER, concurrentDetectorNames));
        }

        if (
            !this.detectorExecutor.isInPosition() &&
            isNoConcurrentOrders &&
            (enterFibPrice / 100) * this.minStopOffsetSize < Math.abs(enterFibPrice - stopFibPrice)
        ) {
            if (!this.order.isActive) {
                this.reportUtil.add(this.getReportData(EReportItemType.PLACE_ORDER));
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
    }

    private getInnerCandles(): Array<CandleModel> {
        return this.segmentUtil.getCurrentInnerCandles();
    }

    private getPrettyDate(): string {
        return this.getCandle().dateString;
    }

    private reportDetection(): void {
        this.reportUtil.add(this.getReportData(EReportItemType.DETECTED_START));
    }

    private reportDetectionEnd(): void {
        this.reportUtil.add(this.getReportData(EReportItemType.DETECTED_END));
    }

    private enterPosition(waitDays: number): void {
        const offset = this.getDaysRange(waitDays);

        this.isInPosition = true;
        this.detectorExecutor.enterPosition();

        this.order.enterDate = this.getCandle().dateString;
        this.order.toZeroDate = this.getCandle().timestamp + offset;

        this.reportUtil.add(this.getReportData(EReportItemType.ENTER_POSITION));
    }

    private exitPosition(): void {
        this.isInPosition = false;
        this.detectorExecutor.exitPosition();

        this.resetOrder();

        this.reportUtil.add(this.getReportData(EReportItemType.EXIT_POSITION));
    }

    private mulCapital(value: number): void {
        this.detectorExecutor.mulCapital(value);
    }

    private addFailToCapital(): void {
        this.mulCapital(this.failMul);
        this.detectorExecutor.addFailCount();
    }

    private addZeroFailToCapital(): void {
        this.mulCapital(this.zeroFailMul);
        this.detectorExecutor.addZeroCount();
    }

    private addProfitToCapital(): void {
        this.mulCapital(this.profitMul);
        this.detectorExecutor.addProfitCount();
    }

    private reportProfitTrade(): void {
        this.reportUtil.add(this.getReportData(EReportItemType.DEAL_PROFIT));
    }

    private reportZeroFailTrade(): void {
        this.reportUtil.add(this.getReportData(EReportItemType.DEAL_ZERO));
    }

    private reportFailTrade(): void {
        this.reportUtil.add(this.getReportData(EReportItemType.DEAL_FAIL));
    }

    private reportCancelTrade(): void {
        this.reportUtil.add(this.getReportData(EReportItemType.CANCEL_ORDER));
    }

    private getDaysRange(count: number): number {
        return Duration.fromObject({ day: count }).toMillis();
    }
}
