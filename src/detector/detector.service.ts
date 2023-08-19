import { Injectable, Logger } from '@nestjs/common';
import { SegmentService } from '../segment/segment.service';
import { DownFlagDetect, UpFlagDetect } from './detect/flag.detect';
import { DownBreakDetect, UpBreakDetect } from './detect/break.detect';
import {
    DownMidTriangleDetect,
    DownTriangleDetect,
    UpMidTriangleDetect,
    UpTriangleDetect,
} from './detect/triangle.detect';
import { DownZigzagDetect, UpZigzagDetect } from './detect/zigzag.detect';
import { DownRestartDetect, UpRestartDetect } from './detect/restart.detect';

@Injectable()
export class DetectorService {
    private readonly logger: Logger = new Logger(DetectorService.name);

    private upFlagDetect: UpFlagDetect;
    private downFlagDetect: DownFlagDetect;
    private upBreakDetect: UpBreakDetect;
    private downBreakDetect: DownBreakDetect;
    private upTriangleDetect: UpTriangleDetect;
    private downTriangleDetect: DownTriangleDetect;
    private upMidTriangleDetect: UpMidTriangleDetect;
    private downMidTriangleDetect: DownMidTriangleDetect;
    private upZigzagDetect: UpZigzagDetect;
    private downZigzagDetect: DownZigzagDetect;
    private upRestartDetect: UpRestartDetect;
    private downRestartDetect: DownRestartDetect;

    private capital = 100;
    private profitCount = 0;
    private zeroCount = 0;
    private failCount = 0;

    constructor(private readonly segmentService: SegmentService) {
        this.upFlagDetect = new UpFlagDetect(this.segmentService, this);
        this.downFlagDetect = new DownFlagDetect(this.segmentService, this);
        this.upBreakDetect = new UpBreakDetect(this.segmentService, this);
        this.downBreakDetect = new DownBreakDetect(this.segmentService, this);
        this.upTriangleDetect = new UpTriangleDetect(this.segmentService, this);
        this.downTriangleDetect = new DownTriangleDetect(this.segmentService, this);
        this.upMidTriangleDetect = new UpMidTriangleDetect(this.segmentService, this);
        this.downMidTriangleDetect = new DownMidTriangleDetect(this.segmentService, this);
        this.upZigzagDetect = new UpZigzagDetect(this.segmentService, this);
        this.downZigzagDetect = new DownZigzagDetect(this.segmentService, this);
        this.upRestartDetect = new UpRestartDetect(this.segmentService, this);
        this.downRestartDetect = new DownRestartDetect(this.segmentService, this);
    }

    detect(): void {
        //this.upFlagDetect.check();
        //this.upFlagDetect.trade();
        //this.downFlagDetect.check();
        //this.downFlagDetect.trade();

        this.upTriangleDetect.check();
        this.upTriangleDetect.trade();
        this.downTriangleDetect.check();
        this.downTriangleDetect.trade();

        this.upMidTriangleDetect.check();
        this.upMidTriangleDetect.trade();
        this.downMidTriangleDetect.check();
        this.downMidTriangleDetect.trade();

        // TODO Use priority
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
