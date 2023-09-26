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

        this.runBreak();
        this.runMidZigzag();
        this.runZigzag();
        this.runMidPennant();
        this.runPennant();
        this.runMidFlag();
        this.runFlag();
        this.runMidRestart();
        this.runRestart();
        this.runMidHead();
        this.runHead();
        this.runMidTriangle();
        this.runTriangle();
        this.runBigZigzag();
        this.runBigPennant();
        this.runBigFlag();
        this.runBigRestart();
        this.runBigHead();
        this.runBigTriangle();
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

    private runBreak(): void {
        this.upBreakDetect.analyze();
        this.downBreakDetect.analyze();
    }

    private runFlag(): void {
        this.upFlagDetect.analyze();
        this.downFlagDetect.analyze();
    }

    private runMidFlag(): void {
        this.upMidFlagDetect.analyze();
        this.downMidFlagDetect.analyze();
    }

    private runBigFlag(): void {
        this.upBigFlagDetect.analyze();
        this.downBigFlagDetect.analyze();
    }

    private runHead(): void {
        this.upHeadDetect.analyze();
        this.downHeadDetect.analyze();
    }

    private runMidHead(): void {
        this.upMidHeadDetect.analyze();
        this.downMidHeadDetect.analyze();
    }

    private runBigHead(): void {
        this.upBigHeadDetect.analyze();
        this.downBigHeadDetect.analyze();
    }

    private runPennant(): void {
        this.upPennantDetect.analyze();
        this.downPennantDetect.analyze();
    }

    private runMidPennant(): void {
        this.upMidPennantDetect.analyze();
        this.downMidPennantDetect.analyze();
    }

    private runBigPennant(): void {
        this.upBigPennantDetect.analyze();
        this.downBigPennantDetect.analyze();
    }

    private runRestart(): void {
        this.upRestartDetect.analyze();
        this.downRestartDetect.analyze();
    }

    private runMidRestart(): void {
        this.upMidRestartDetect.analyze();
        this.downMidRestartDetect.analyze();
    }

    private runBigRestart(): void {
        this.upBigRestartDetect.analyze();
        this.downBigRestartDetect.analyze();
    }

    private runTriangle(): void {
        this.upTriangleDetect.analyze();
        this.downTriangleDetect.analyze();
    }

    private runMidTriangle(): void {
        this.upMidTriangleDetect.analyze();
        this.downMidTriangleDetect.analyze();
    }

    private runBigTriangle(): void {
        this.upBigTriangleDetect.analyze();
        this.downBigTriangleDetect.analyze();
    }

    private runZigzag(): void {
        this.upZigzagDetect.analyze();
        this.downZigzagDetect.analyze();
    }

    private runMidZigzag(): void {
        this.upMidZigzagDetect.analyze();
        this.downMidZigzagDetect.analyze();
    }

    private runBigZigzag(): void {
        this.upBigZigzagDetect.analyze();
        this.downBigZigzagDetect.analyze();
    }
}
