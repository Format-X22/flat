import { Injectable, Logger } from '@nestjs/common';
import { TOrder } from './trade.dto';
import { SegmentService } from '../segment/segment.service';
import { DetectorService } from '../detector/detector.service';
import { Duration } from 'luxon';
import { CandleModel } from '../loader/candle.model';
import { TDetections } from '../detector/detector.dto';

@Injectable()
export class TradeService {
    private static makeEmptyOrder(): TOrder {
        return {
            isActive: false,
            enter: null,
            take: null,
            stop: null,
            enterDate: null,
            toZeroDate: null,
        };
    }

    private logger: Logger = new Logger(TradeService.name);
    private orderId = 0;

    private upFlag: TOrder = TradeService.makeEmptyOrder();
    private downFlag: TOrder = TradeService.makeEmptyOrder();
    private upTrendBreak: TOrder = TradeService.makeEmptyOrder();
    private downTrendBreak: TOrder = TradeService.makeEmptyOrder();
    private upTriangleBreak: TOrder = TradeService.makeEmptyOrder();
    private downTriangleBreak: TOrder = TradeService.makeEmptyOrder();
    private upTriangleBack: TOrder = TradeService.makeEmptyOrder();
    private downTriangleBack: TOrder = TradeService.makeEmptyOrder();
    private upRestartTrend: TOrder = TradeService.makeEmptyOrder();
    private downRestartTrend: TOrder = TradeService.makeEmptyOrder();

    private inPosition = false;
    private candle: CandleModel;
    private detections: TDetections;

    private capital = 100;

    private toZeroFail = 0.95;
    private toFail = 0.66;

    private upFlagProfit = 2;
    private downFlagProfit = 2;
    private upTrendBreakProfit = 2.3;
    private downTrendBreakProfit = 2.3;
    private upTriangleBreakProfit = 1.5;
    private downTriangleBreakProfit = 1.5;
    private upTriangleBackProfit = 2.1;
    private downTriangleBackProfit = 2.1;
    private upRestartTrendProfit = 2;
    private downRestartTrendProfit = 2;

    constructor(private readonly segment: SegmentService, private readonly detector: DetectorService) {}

    printCapital(): void {
        this.logger.log(`CAPITAL = ${this.capital.toFixed(0)}`);
    }

    tick(): void {
        this.candle = this.segment.getCurrentCandle();
        this.detections = this.detector.detect();

        this.handleUpFlag();
        this.handleDownFlag();

        // TODO Check priority
    }

    handleUpFlag(): void {
        const candle = this.candle;
        const detections = this.detections;

        if (this.upFlag.isActive) {
            if (this.inPosition) {
                if (this.upFlag.toZeroDate <= candle.timestamp) {
                    if (
                        (candle.open <= this.upFlag.enter && candle.high > this.upFlag.enter) ||
                        (candle.open > this.upFlag.enter && candle.low < this.upFlag.enter)
                    ) {
                        this.capital *= this.toZeroFail;
                        this.upFlag = TradeService.makeEmptyOrder();
                        this.inPosition = false;

                        this.printTrade('ZERO UP FLAG');
                    }
                }

                if (this.upFlag.isActive && candle.high > this.upFlag.take) {
                    this.capital *= this.upFlagProfit;
                    this.upFlag = TradeService.makeEmptyOrder();
                    this.inPosition = false;

                    this.printTrade('PROFIT UP FLAG');
                }

                if (this.upFlag.isActive && candle.low <= this.upFlag.stop) {
                    this.capital *= this.toFail;
                    this.upFlag = TradeService.makeEmptyOrder();
                    this.inPosition = false;

                    this.printTrade('FAIL UP FLAG');
                }
            } else {
                if (candle.high > this.upFlag.take) {
                    this.capital *= this.upFlagProfit;
                    this.upFlag = TradeService.makeEmptyOrder();

                    this.printTrade('PROFIT UP FLAG');
                } else if (candle.high > this.upFlag.enter) {
                    this.inPosition = true;

                    this.upFlag.enterDate = candle.dateString;
                    this.upFlag.toZeroDate = candle.timestamp + Duration.fromObject({ day: 2 }).toMillis();
                }
            }
        }

        if (detections.upFlag) {
            const [current, prev1, prev2] = this.segment.getSegments(3);
            let fib_0_73;
            let fib_1_00;
            let fib_2_00;

            if (current.isDown) {
                const currentUpWaveMax = Math.max(current.max, prev1.max);

                fib_0_73 = this.segment.getFib(currentUpWaveMax, current.min, 0.73, true);
                fib_1_00 = this.segment.getFib(currentUpWaveMax, current.min, 1, true);
                fib_2_00 = this.segment.getFib(currentUpWaveMax, current.min, 2, true);
            } else {
                const lastUpWaveMax = Math.max(prev1.max, prev2.max);
                const currentDownWaveMin = Math.min(current.min, prev1.min);

                fib_0_73 = this.segment.getFib(lastUpWaveMax, currentDownWaveMin, 0.73, true);
                fib_1_00 = this.segment.getFib(lastUpWaveMax, currentDownWaveMin, 1, true);
                fib_2_00 = this.segment.getFib(lastUpWaveMax, currentDownWaveMin, 2, true);
            }

            if (fib_1_00 / 100 < fib_1_00 - fib_0_73) {
                this.upFlag.isActive = true;
                this.upFlag.enter = fib_1_00;
                this.upFlag.take = fib_2_00;
                this.upFlag.stop = fib_0_73;
            }
        } else if (this.upFlag.isActive && !this.inPosition) {
            this.upFlag = TradeService.makeEmptyOrder();

            this.printTrade('CANCEL UP FLAG', false);
        }
    }

    handleDownFlag(): void {
        const candle = this.candle;
        const detections = this.detections;

        if (this.downFlag.isActive) {
            if (this.inPosition) {
                if (this.downFlag.toZeroDate <= candle.timestamp) {
                    if (
                        (candle.open >= this.downFlag.enter && candle.low < this.downFlag.enter) ||
                        (candle.open < this.downFlag.enter && candle.high > this.downFlag.enter)
                    ) {
                        this.capital *= this.toZeroFail;
                        this.downFlag = TradeService.makeEmptyOrder();
                        this.inPosition = false;

                        this.printTrade('ZERO DOWN FLAG');
                    }
                }

                if (this.downFlag.isActive && candle.low < this.downFlag.take) {
                    this.capital *= this.downFlagProfit;
                    this.downFlag = TradeService.makeEmptyOrder();
                    this.inPosition = false;

                    this.printTrade('PROFIT DOWN FLAG');
                }

                if (this.downFlag.isActive && candle.high >= this.downFlag.stop) {
                    this.capital *= this.toFail;
                    this.downFlag = TradeService.makeEmptyOrder();
                    this.inPosition = false;

                    this.printTrade('FAIL DOWN FLAG');
                }
            } else {
                if (candle.low < this.downFlag.take) {
                    this.capital *= this.downFlagProfit;
                    this.downFlag = TradeService.makeEmptyOrder();

                    this.printTrade('PROFIT DOWN FLAG');
                } else if (candle.low < this.downFlag.enter) {
                    this.inPosition = true;

                    this.downFlag.enterDate = candle.dateString;
                    this.downFlag.toZeroDate = candle.timestamp + Duration.fromObject({ day: 2 }).toMillis();
                }
            }
        }

        if (detections.downFlag) {
            const [current, prev1, prev2] = this.segment.getSegments(3);
            let fib_0_73;
            let fib_1_00;
            let fib_2_00;

            if (current.isUp) {
                const currentDownWaveMin = Math.min(current.min, prev1.min);

                fib_0_73 = this.segment.getFib(currentDownWaveMin, current.max, 0.73, false);
                fib_1_00 = this.segment.getFib(currentDownWaveMin, current.max, 1, false);
                fib_2_00 = this.segment.getFib(currentDownWaveMin, current.max, 2, false);
            } else {
                const lastDownWaveMin = Math.min(prev1.min, prev2.min);
                const currentUpWaveMax = Math.max(current.max, prev1.max);

                fib_0_73 = this.segment.getFib(lastDownWaveMin, currentUpWaveMax, 0.73, false);
                fib_1_00 = this.segment.getFib(lastDownWaveMin, currentUpWaveMax, 1, false);
                fib_2_00 = this.segment.getFib(lastDownWaveMin, currentUpWaveMax, 2, false);
            }

            if (fib_1_00 / 100 < fib_0_73 - fib_1_00) {
                this.downFlag.isActive = true;
                this.downFlag.enter = fib_1_00;
                this.downFlag.take = fib_2_00;
                this.downFlag.stop = fib_0_73;
            }
        } else if (this.downFlag.isActive && !this.inPosition) {
            this.downFlag = TradeService.makeEmptyOrder();

            this.printTrade('CANCEL DOWN FLAG', false);
        }
    }

    printTrade(prefix: string, printCapital = true): void {
        if (printCapital) {
            this.logger.log(`${prefix} - ${this.capital.toFixed(0)} - ${this.candle.dateString}`);
        } else {
            this.logger.log(`${prefix} - ${this.candle.dateString}`);
        }
    }
}
