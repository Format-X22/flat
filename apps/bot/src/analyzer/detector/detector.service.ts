import { Injectable, Logger } from '@nestjs/common';
import { SegmentService } from '../segment/segment.service';
import {
    DownBigFlagDetect,
    DownFlagDetect,
    DownMidFlagDetect,
    UpBigFlagDetect,
    UpFlagDetect,
    UpMidFlagDetect,
} from './detect/flag.detect';
import { DownBreakDetect, UpBreakDetect } from './detect/break.detect';
import {
    DownBigTriangleDetect,
    DownMidTriangleDetect,
    DownTriangleDetect,
    UpBigTriangleDetect,
    UpMidTriangleDetect,
    UpTriangleDetect,
} from './detect/triangle.detect';
import {
    DownBigZigzagDetect,
    DownMidZigzagDetect,
    DownZigzagDetect,
    UpBigZigzagDetect,
    UpMidZigzagDetect,
    UpZigzagDetect,
} from './detect/zigzag.detect';
import {
    DownBigRestartDetect,
    DownMidRestartDetect,
    DownRestartDetect,
    UpBigRestartDetect,
    UpMidRestartDetect,
    UpRestartDetect,
} from './detect/restart.detect';
import { AbstractDetect } from './detect/abstract.detect';
import {
    DownBigPennantDetect,
    DownMidPennantDetect,
    DownPennantDetect,
    UpBigPennantDetect,
    UpMidPennantDetect,
    UpPennantDetect,
} from './detect/pennant.detect';
import {
    DownBigHeadDetect,
    DownHeadDetect,
    DownMidHeadDetect,
    UpBigHeadDetect,
    UpHeadDetect,
    UpMidHeadDetect,
} from './detect/head.detect';
import { TActualOrder } from './detector.dto';

@Injectable()
export class DetectorService {
    private readonly logger: Logger = new Logger(DetectorService.name);

    isSilent: boolean;

    private upBreakDetect: UpBreakDetect;
    private downBreakDetect: DownBreakDetect;
    private upFlagDetect: UpFlagDetect;
    private downFlagDetect: DownFlagDetect;
    private upMidFlagDetect: UpMidFlagDetect;
    private downMidFlagDetect: DownMidFlagDetect;
    private upBigFlagDetect: UpBigFlagDetect;
    private downBigFlagDetect: DownBigFlagDetect;
    private upHeadDetect: UpHeadDetect;
    private downHeadDetect: DownHeadDetect;
    private upMidHeadDetect: UpMidHeadDetect;
    private downMidHeadDetect: DownMidHeadDetect;
    private upBigHeadDetect: UpBigHeadDetect;
    private downBigHeadDetect: DownBigHeadDetect;
    private upPennantDetect: UpPennantDetect;
    private downPennantDetect: DownPennantDetect;
    private upMidPennantDetect: UpMidPennantDetect;
    private downMidPennantDetect: DownMidPennantDetect;
    private upBigPennantDetect: UpBigPennantDetect;
    private downBigPennantDetect: DownBigPennantDetect;
    private upTriangleDetect: UpTriangleDetect;
    private downTriangleDetect: DownTriangleDetect;
    private upMidTriangleDetect: UpMidTriangleDetect;
    private downMidTriangleDetect: DownMidTriangleDetect;
    private upBigTriangleDetect: UpBigTriangleDetect;
    private downBigTriangleDetect: DownBigTriangleDetect;
    private upZigzagDetect: UpZigzagDetect;
    private downZigzagDetect: DownZigzagDetect;
    private upMidZigzagDetect: UpMidZigzagDetect;
    private downMidZigzagDetect: DownMidZigzagDetect;
    private upBigZigzagDetect: UpBigZigzagDetect;
    private downBigZigzagDetect: DownBigZigzagDetect;
    private upRestartDetect: UpRestartDetect;
    private downRestartDetect: DownRestartDetect;
    private upMidRestartDetect: UpMidRestartDetect;
    private downMidRestartDetect: DownMidRestartDetect;
    private upBigRestartDetect: UpBigRestartDetect;
    private downBigRestartDetect: DownBigRestartDetect;

    private capital = 100;
    private profitCount = 0;
    private zeroCount = 0;
    private failCount = 0;

    protected isInPositionNow: boolean = false;
    protected upOrderDetector: AbstractDetect;
    protected downOrderDetector: AbstractDetect;

    constructor(private readonly segmentService: SegmentService) {
        this.upBreakDetect = new UpBreakDetect(this.segmentService, this);
        this.downBreakDetect = new DownBreakDetect(this.segmentService, this);
        this.upFlagDetect = new UpFlagDetect(this.segmentService, this);
        this.downFlagDetect = new DownFlagDetect(this.segmentService, this);
        this.upMidFlagDetect = new UpMidFlagDetect(this.segmentService, this);
        this.downMidFlagDetect = new DownMidFlagDetect(this.segmentService, this);
        this.upBigFlagDetect = new UpBigFlagDetect(this.segmentService, this);
        this.downBigFlagDetect = new DownBigFlagDetect(this.segmentService, this);
        this.upHeadDetect = new UpHeadDetect(this.segmentService, this);
        this.downHeadDetect = new DownHeadDetect(this.segmentService, this);
        this.upMidHeadDetect = new UpMidHeadDetect(this.segmentService, this);
        this.downMidHeadDetect = new DownMidHeadDetect(this.segmentService, this);
        this.upBigHeadDetect = new UpBigHeadDetect(this.segmentService, this);
        this.downBigHeadDetect = new DownBigHeadDetect(this.segmentService, this);
        this.upPennantDetect = new UpPennantDetect(this.segmentService, this);
        this.downPennantDetect = new DownPennantDetect(this.segmentService, this);
        this.upMidPennantDetect = new UpMidPennantDetect(this.segmentService, this);
        this.downMidPennantDetect = new DownMidPennantDetect(this.segmentService, this);
        this.upBigPennantDetect = new UpBigPennantDetect(this.segmentService, this);
        this.downBigPennantDetect = new DownBigPennantDetect(this.segmentService, this);
        this.upTriangleDetect = new UpTriangleDetect(this.segmentService, this);
        this.downTriangleDetect = new DownTriangleDetect(this.segmentService, this);
        this.upMidTriangleDetect = new UpMidTriangleDetect(this.segmentService, this);
        this.downMidTriangleDetect = new DownMidTriangleDetect(this.segmentService, this);
        this.upBigTriangleDetect = new UpBigTriangleDetect(this.segmentService, this);
        this.downBigTriangleDetect = new DownBigTriangleDetect(this.segmentService, this);
        this.upZigzagDetect = new UpZigzagDetect(this.segmentService, this);
        this.downZigzagDetect = new DownZigzagDetect(this.segmentService, this);
        this.upMidZigzagDetect = new UpMidZigzagDetect(this.segmentService, this);
        this.downMidZigzagDetect = new DownMidZigzagDetect(this.segmentService, this);
        this.upBigZigzagDetect = new UpBigZigzagDetect(this.segmentService, this);
        this.downBigZigzagDetect = new DownBigZigzagDetect(this.segmentService, this);
        this.upRestartDetect = new UpRestartDetect(this.segmentService, this);
        this.downRestartDetect = new DownRestartDetect(this.segmentService, this);
        this.upMidRestartDetect = new UpMidRestartDetect(this.segmentService, this);
        this.downMidRestartDetect = new DownMidRestartDetect(this.segmentService, this);
        this.upBigRestartDetect = new UpBigRestartDetect(this.segmentService, this);
        this.downBigRestartDetect = new DownBigRestartDetect(this.segmentService, this);
    }

    detect(isSilent = false): void {
        this.isSilent = isSilent;

        this.upBreakDetect.check();
        this.downBreakDetect.check();
        this.upMidZigzagDetect.check();
        this.downMidZigzagDetect.check();
        this.upZigzagDetect.check();
        this.downZigzagDetect.check();
        this.upMidPennantDetect.check();
        this.downMidPennantDetect.check();
        this.upPennantDetect.check();
        this.downPennantDetect.check();
        this.upMidFlagDetect.check();
        this.downMidFlagDetect.check();
        this.upFlagDetect.check();
        this.downFlagDetect.check();
        this.upMidRestartDetect.check();
        this.downMidRestartDetect.check();
        this.upRestartDetect.check();
        this.downRestartDetect.check();
        this.upMidHeadDetect.check();
        this.downMidHeadDetect.check();
        this.upHeadDetect.check();
        this.downHeadDetect.check();
        this.upMidTriangleDetect.check();
        this.downMidTriangleDetect.check();
        this.upTriangleDetect.check();
        this.downTriangleDetect.check();
        this.upBigZigzagDetect.check();
        this.downBigZigzagDetect.check();
        this.upBigPennantDetect.check();
        this.downBigPennantDetect.check();
        this.upBigFlagDetect.check();
        this.downBigFlagDetect.check();
        this.upBigRestartDetect.check();
        this.downBigRestartDetect.check();
        this.upBigHeadDetect.check();
        this.downBigHeadDetect.check();
        this.upBigTriangleDetect.check();
        this.downBigTriangleDetect.check();

        this.upBreakDetect.handleOrder();
        this.downBreakDetect.handleOrder();
        this.upMidZigzagDetect.handleOrder();
        this.downMidZigzagDetect.handleOrder();
        this.upZigzagDetect.handleOrder();
        this.downZigzagDetect.handleOrder();
        this.upMidPennantDetect.handleOrder();
        this.downMidPennantDetect.handleOrder();
        this.upPennantDetect.handleOrder();
        this.downPennantDetect.handleOrder();
        this.upMidFlagDetect.handleOrder();
        this.downMidFlagDetect.handleOrder();
        this.upFlagDetect.handleOrder();
        this.downFlagDetect.handleOrder();
        this.upMidRestartDetect.handleOrder();
        this.downMidRestartDetect.handleOrder();
        this.upRestartDetect.handleOrder();
        this.downRestartDetect.handleOrder();
        this.upMidHeadDetect.handleOrder();
        this.downMidHeadDetect.handleOrder();
        this.upHeadDetect.handleOrder();
        this.downHeadDetect.handleOrder();
        this.upMidTriangleDetect.handleOrder();
        this.downMidTriangleDetect.handleOrder();
        this.upTriangleDetect.handleOrder();
        this.downTriangleDetect.handleOrder();
        this.upBigZigzagDetect.handleOrder();
        this.downBigZigzagDetect.handleOrder();
        this.upBigPennantDetect.handleOrder();
        this.downBigPennantDetect.handleOrder();
        this.upBigFlagDetect.handleOrder();
        this.downBigFlagDetect.handleOrder();
        this.upBigRestartDetect.handleOrder();
        this.downBigRestartDetect.handleOrder();
        this.upBigHeadDetect.handleOrder();
        this.downBigHeadDetect.handleOrder();
        this.upBigTriangleDetect.handleOrder();
        this.downBigTriangleDetect.handleOrder();

        this.upBreakDetect.resetOrderIfNoPosition();
        this.downBreakDetect.resetOrderIfNoPosition();
        this.upMidZigzagDetect.resetOrderIfNoPosition();
        this.downMidZigzagDetect.resetOrderIfNoPosition();
        this.upZigzagDetect.resetOrderIfNoPosition();
        this.downZigzagDetect.resetOrderIfNoPosition();
        this.upMidPennantDetect.resetOrderIfNoPosition();
        this.downMidPennantDetect.resetOrderIfNoPosition();
        this.upPennantDetect.resetOrderIfNoPosition();
        this.downPennantDetect.resetOrderIfNoPosition();
        this.upMidFlagDetect.resetOrderIfNoPosition();
        this.downMidFlagDetect.resetOrderIfNoPosition();
        this.upFlagDetect.resetOrderIfNoPosition();
        this.downFlagDetect.resetOrderIfNoPosition();
        this.upMidRestartDetect.resetOrderIfNoPosition();
        this.downMidRestartDetect.resetOrderIfNoPosition();
        this.upRestartDetect.resetOrderIfNoPosition();
        this.downRestartDetect.resetOrderIfNoPosition();
        this.upMidHeadDetect.resetOrderIfNoPosition();
        this.downMidHeadDetect.resetOrderIfNoPosition();
        this.upHeadDetect.resetOrderIfNoPosition();
        this.downHeadDetect.resetOrderIfNoPosition();
        this.upMidTriangleDetect.resetOrderIfNoPosition();
        this.downMidTriangleDetect.resetOrderIfNoPosition();
        this.upTriangleDetect.resetOrderIfNoPosition();
        this.downTriangleDetect.resetOrderIfNoPosition();
        this.upBigZigzagDetect.resetOrderIfNoPosition();
        this.downBigZigzagDetect.resetOrderIfNoPosition();
        this.upBigPennantDetect.resetOrderIfNoPosition();
        this.downBigPennantDetect.resetOrderIfNoPosition();
        this.upBigFlagDetect.resetOrderIfNoPosition();
        this.downBigFlagDetect.resetOrderIfNoPosition();
        this.upBigRestartDetect.resetOrderIfNoPosition();
        this.downBigRestartDetect.resetOrderIfNoPosition();
        this.upBigHeadDetect.resetOrderIfNoPosition();
        this.downBigHeadDetect.resetOrderIfNoPosition();
        this.upBigTriangleDetect.resetOrderIfNoPosition();
        this.downBigTriangleDetect.resetOrderIfNoPosition();

        this.upMidZigzagDetect.handleTradeDetection();
        this.downMidZigzagDetect.handleTradeDetection();
        this.upZigzagDetect.handleTradeDetection();
        this.downZigzagDetect.handleTradeDetection();
        this.upBreakDetect.handleTradeDetection();
        this.downBreakDetect.handleTradeDetection();
        this.upMidPennantDetect.handleTradeDetection();
        this.downMidPennantDetect.handleTradeDetection();
        this.upPennantDetect.handleTradeDetection();
        this.downPennantDetect.handleTradeDetection();
        this.upMidFlagDetect.handleTradeDetection();
        this.downMidFlagDetect.handleTradeDetection();
        this.upFlagDetect.handleTradeDetection();
        this.downFlagDetect.handleTradeDetection();
        this.upMidRestartDetect.handleTradeDetection();
        this.downMidRestartDetect.handleTradeDetection();
        this.upRestartDetect.handleTradeDetection();
        this.downRestartDetect.handleTradeDetection();
        this.upMidTriangleDetect.handleTradeDetection();
        this.downMidTriangleDetect.handleTradeDetection();
        this.upTriangleDetect.handleTradeDetection();
        this.downTriangleDetect.handleTradeDetection();
        this.upBigZigzagDetect.handleTradeDetection();
        this.downBigZigzagDetect.handleTradeDetection();
        this.upBigPennantDetect.handleTradeDetection();
        this.downBigPennantDetect.handleTradeDetection();
        this.upBigFlagDetect.handleTradeDetection();
        this.downBigFlagDetect.handleTradeDetection();
        this.upBigRestartDetect.handleTradeDetection();
        this.downBigRestartDetect.handleTradeDetection();
        this.upBigTriangleDetect.handleTradeDetection();
        this.downBigTriangleDetect.handleTradeDetection();
    }

    getOrders(): TActualOrder {
        return {
            up: this.upOrderDetector?.order,
            down: this.downOrderDetector?.order,
        };
    }

    printLastOrders(): void {
        const upDetector = this.upOrderDetector;
        const downDetector = this.downOrderDetector;
        const upName = upDetector?.constructor.name;
        const downName = downDetector?.constructor.name;
        const upOrder = upDetector?.order;
        const downOrder = downDetector?.order;
        const format = (v) => JSON.stringify(v, null, 2);
        let result;

        if (upOrder && downOrder) {
            result = [`${upName} - ${format(upOrder)}`, `${downName} - ${format(downOrder)}`].join('\n\n');
        } else if (upOrder) {
            result = `${upName} - ${format(upOrder)}`;
        } else if (downOrder) {
            result = `${downName} - ${format(downOrder)}`;
        } else {
            result = '\n\n~~~ No active orders ~~~';
        }

        this.logger.log(result);
    }

    isInPosition(): boolean {
        return this.isInPositionNow;
    }

    enterPosition(): void {
        this.isInPositionNow = true;
    }

    exitPosition(): void {
        this.isInPositionNow = false;
    }

    isConcurrentUpOrder(detector: AbstractDetect): boolean {
        return this.upOrderDetector && this.upOrderDetector !== detector;
    }

    isConcurrentDownOrder(detector: AbstractDetect): boolean {
        return this.downOrderDetector && this.downOrderDetector !== detector;
    }

    addUpOrder(detector: AbstractDetect): void {
        this.upOrderDetector = detector;
    }

    addDownOrder(detector: AbstractDetect): void {
        this.downOrderDetector = detector;
    }

    removeUpOrder(detector: AbstractDetect): void {
        if (this.upOrderDetector === detector) {
            this.upOrderDetector = null;
        }
    }

    removeDownOrder(detector: AbstractDetect): void {
        if (this.downOrderDetector === detector) {
            this.downOrderDetector = null;
        }
    }

    getUpOrderOrigin(): AbstractDetect {
        return this.upOrderDetector;
    }

    getDownOrderOrigin(): AbstractDetect {
        return this.downOrderDetector;
    }

    getCapital(): number {
        return this.capital;
    }

    mulCapital(value: number): void {
        this.capital *= value;
    }

    addProfitCount(): void {
        this.profitCount++;
    }

    addZeroCount(): void {
        this.zeroCount++;
    }

    addFailCount(): void {
        this.failCount++;
    }

    getPrettyCapital(): string {
        return (this.capital / 1_000).toFixed(3);
    }

    printCapital(): void {
        this.logger.log(
            `CAPITAL = ${this.getPrettyCapital()} - P: ${this.profitCount} Z: ${this.zeroCount} F: ${this.failCount}`,
        );
    }
}
