import { AbstractDetect } from './abstract.detect';
import { SegmentService } from '../../segment/segment.service';
import { DetectorService } from '../detector.service';

export class FlagDetect extends AbstractDetect {
    profitMul = 2;

    check(): boolean {
        const [current, prev1, prev2, prev3, prev4] = this.getSegments(5);

        if (!prev4) {
            return false;
        }

        if (this.isSegmentDown(current)) {
            const currentUpWaveMax = this.max(current, prev1);
            const lastUpWaveMax = this.max(prev2, prev3);
            const lastDownWaveMin = this.min(prev1, prev2);
            const fib5 = this.getFib(currentUpWaveMax, lastDownWaveMin, 0.5, true);

            if (
                this.sizeGt(current, 1) &&
                this.gt(this.segmentMin(current), fib5) &&
                this.lt(lastUpWaveMax, this.segmentMin(current)) &&
                this.gte(currentUpWaveMax, this.segmentMax(current))
            ) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        } else {
            const currentDownWaveMin = this.min(current, prev1);
            const lastUpWaveMax = this.max(prev1, prev2);
            const last2UpWaveMax = this.max(prev3, prev4);
            const lastDownWaveMin = this.min(prev2, prev3);
            const fib5 = this.getFib(lastUpWaveMax, lastDownWaveMin, 0.5, true);

            if (
                this.sizeGt(prev1, 1) &&
                this.gt(currentDownWaveMin, fib5) &&
                this.lt(last2UpWaveMax, currentDownWaveMin) &&
                this.gte(lastUpWaveMax, this.segmentMax(current))
            ) {
                return this.markDetection();
            } else {
                return this.markEndDetection();
            }
        }
    }

    trade(): void {
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
                    this.enterPosition(2);

                    if (this.lt(this.getCandle().close, this.order.stop)) {
                        this.addFailToCapital();
                        this.exitPosition();
                        this.printFailTrade();
                    }
                }
            }
        }

        if (!this.isInPosition) {
            if (this.isDetected) {
                const [current, prev1, prev2] = this.getSegments(3);
                let fib_0_73;
                let fib_1_00;
                let fib_2_00;

                if (this.isSegmentDown(current)) {
                    const currentUpWaveMax = this.max(current, prev1);
                    const currentMin = this.segmentMin(current);

                    fib_0_73 = this.getFib(currentUpWaveMax, currentMin, 0.5, true);
                    fib_1_00 = this.getFib(currentUpWaveMax, currentMin, 1, true);
                    fib_2_00 = this.getFib(currentUpWaveMax, currentMin, 2.95, true);
                } else {
                    const lastUpWaveMax = this.max(prev1, prev2);
                    const currentDownWaveMin = this.min(current, prev1);

                    fib_0_73 = this.getFib(lastUpWaveMax, currentDownWaveMin, 0.5, true);
                    fib_1_00 = this.getFib(lastUpWaveMax, currentDownWaveMin, 1, true);
                    fib_2_00 = this.getFib(lastUpWaveMax, currentDownWaveMin, 2.95, true);
                }

                if (this.constLt(fib_1_00 / 100, this.diff(fib_1_00, fib_0_73))) {
                    this.order.isActive = true;
                    this.order.enter = fib_1_00;
                    this.order.take = fib_2_00;
                    this.order.stop = fib_0_73;
                }
            } else if (this.order.isActive) {
                this.resetOrder();
                this.printCancelTrade();
            }
        }
    }
}

export class UpFlagDetect extends FlagDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('UP FLAG', true, segmentService, detectorService);
    }
}

export class DownFlagDetect extends FlagDetect {
    constructor(segmentService: SegmentService, detectorService: DetectorService) {
        super('DOWN FLAG', false, segmentService, detectorService);
    }
}
