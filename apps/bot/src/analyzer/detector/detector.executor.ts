import { Logger } from '@nestjs/common';
import { AbstractDetect } from './detect/abstract.detect';
import { TActualOrder } from './detector.dto';
import { SegmentUtil } from '../wave/segment.util';
import * as Zigzag from './detect/zigzag.detect';
import * as Break from './detect/break.detect';
import * as Pennant from './detect/pennant.detect';
import * as Flag from './detect/flag.detect';
import * as Restart from './detect/restart.detect';
import * as Triangle from './detect/triangle.detect';
import * as Double from './detect/double.detect';

export class DetectorExecutor {
    private readonly logger: Logger = new Logger(DetectorExecutor.name);
    private readonly detects: Array<AbstractDetect>;

    isSilent: boolean;

    private capital = 100;
    private profitCount = 0;
    private zeroCount = 0;
    private failCount = 0;

    protected isInPositionNow: boolean = false;
    protected upOrderDetector: AbstractDetect;
    protected downOrderDetector: AbstractDetect;
    protected risk: number;

    constructor(private readonly segmentUtil: SegmentUtil) {
        this.detects = [
            Zigzag.UpMid,
            Zigzag.DownMid,
            Zigzag.Up,
            Zigzag.Down,
            Break.Up,
            Break.Down,
            Pennant.UpMid,
            Pennant.DownMid,
            Pennant.Up,
            Pennant.Down,
            Flag.UpMid,
            Flag.DownMid,
            Flag.Up,
            Flag.Down,
            Restart.UpMid,
            Restart.DownMid,
            Restart.Up,
            Restart.Down,
            Triangle.UpMid,
            Triangle.DownMid,
            Triangle.Up,
            Triangle.Down,
            Double.UpMid,
            Double.DownMid,
            Double.Up,
            Double.Down,
            Zigzag.UpBig,
            Zigzag.DownBig,
            Pennant.UpBig,
            Pennant.DownBig,
            Flag.UpBig,
            Flag.DownBig,
            Restart.UpBig,
            Restart.DownBig,
            Triangle.UpBig,
            Triangle.DownBig,
            Double.UpBig,
            Double.DownBig,
        ].map((D) => new D(this.segmentUtil, this));
    }

    detect(isSilent: boolean, risk: number): void {
        this.risk = risk;
        this.isSilent = isSilent;

        this.detects.forEach((d) => d.check());
        this.detects.forEach((d) => d.handleOrder());
        this.detects.forEach((d) => d.resetOrderIfNoPosition());
        this.detects.forEach((d) => d.handleTradeDetection());
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
        const upName = upDetector?.name;
        const downName = downDetector?.name;
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

    getRisk(): number {
        return this.risk;
    }
}
