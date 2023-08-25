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

@Injectable()
export class DetectorService {
    private readonly logger: Logger = new Logger(DetectorService.name);

    private upBreakDetect: UpBreakDetect;
    private downBreakDetect: DownBreakDetect;
    private upFlagDetect: UpFlagDetect;
    private downFlagDetect: DownFlagDetect;
    private upMidFlagDetect: UpMidFlagDetect;
    private downMidFlagDetect: DownMidFlagDetect;
    private upBigFlagDetect: UpBigFlagDetect;
    private downBigFlagDetect: DownBigFlagDetect;
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

    detect(): void {
        this.upMidZigzagDetect.check();
        this.upMidZigzagDetect.trade();
        this.downMidZigzagDetect.check();
        this.downMidZigzagDetect.trade();

        this.upZigzagDetect.check();
        this.upZigzagDetect.trade();
        this.downZigzagDetect.check();
        this.downZigzagDetect.trade();

        this.upMidFlagDetect.check();
        this.upMidFlagDetect.trade();
        this.downMidFlagDetect.check();
        this.downMidFlagDetect.trade();

        this.upFlagDetect.check();
        this.upFlagDetect.trade();
        this.downFlagDetect.check();
        this.downFlagDetect.trade();

        this.upMidRestartDetect.check();
        this.upMidRestartDetect.trade();
        this.downMidRestartDetect.check();
        this.downMidRestartDetect.trade();

        this.upRestartDetect.check();
        this.upRestartDetect.trade();
        this.downRestartDetect.check();
        this.downRestartDetect.trade();

        this.upMidTriangleDetect.check();
        this.upMidTriangleDetect.trade();
        this.downMidTriangleDetect.check();
        this.downMidTriangleDetect.trade();

        this.upTriangleDetect.check();
        this.upTriangleDetect.trade();
        this.downTriangleDetect.check();
        this.downTriangleDetect.trade();

        this.upBigZigzagDetect.check();
        this.upBigZigzagDetect.trade();
        this.downBigZigzagDetect.check();
        this.downBigZigzagDetect.trade();

        this.upBigFlagDetect.check();
        this.upBigFlagDetect.trade();
        this.downBigFlagDetect.check();
        this.downBigFlagDetect.trade();

        this.upBigRestartDetect.check();
        this.upBigRestartDetect.trade();
        this.downBigRestartDetect.check();
        this.downBigRestartDetect.trade();

        this.upBigTriangleDetect.check();
        this.upBigTriangleDetect.trade();
        this.downBigTriangleDetect.check();
        this.downBigTriangleDetect.trade();
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

    getUpOrderOrigin(): AbstractDetect {
        return this.upOrderDetector;
    }

    getDownOrderOrigin(): AbstractDetect {
        return this.downOrderDetector;
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
        return this.capital.toFixed(0);
    }

    printCapital(): void {
        this.logger.log(
            `CAPITAL = ${this.getPrettyCapital()} - P: ${this.profitCount} Z: ${this.zeroCount} F: ${this.failCount}`,
        );
    }
}
