import { Injectable, Logger } from '@nestjs/common';
import { SegmentService } from '../segment/segment.service';
import { DownFlagDetect, UpFlagDetect } from './detect/flag.detect';
import { DownBreakDetect, UpBreakDetect } from './detect/break.detect';
import { DownTriangleDetect, UpTriangleDetect } from './detect/triangle.detect';
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
    private upZigzagDetect: UpZigzagDetect;
    private downZigzagDetect: DownZigzagDetect;
    private upRestartDetect: UpRestartDetect;
    private downRestartDetect: DownRestartDetect;

    private capital = 100;

    constructor(private readonly segmentService: SegmentService) {
        this.upFlagDetect = new UpFlagDetect(this.segmentService, this);
        this.downFlagDetect = new DownFlagDetect(this.segmentService, this);
        this.upBreakDetect = new UpBreakDetect(this.segmentService, this);
        this.downBreakDetect = new DownBreakDetect(this.segmentService, this);
        this.upTriangleDetect = new UpTriangleDetect(this.segmentService, this);
        this.downTriangleDetect = new DownTriangleDetect(this.segmentService, this);
        this.upZigzagDetect = new UpZigzagDetect(this.segmentService, this);
        this.downZigzagDetect = new DownZigzagDetect(this.segmentService, this);
        this.upRestartDetect = new UpRestartDetect(this.segmentService, this);
        this.downRestartDetect = new DownRestartDetect(this.segmentService, this);
    }

    detect(): void {
        this.upFlagDetect.check();
        this.upFlagDetect.trade();
        this.downFlagDetect.check();
        this.downFlagDetect.trade();

        // TODO Use priority
    }

    getCapital(): number {
        return this.capital;
    }

    mulCapital(value: number): void {
        this.capital *= value;
    }

    getPrettyCapital(): string {
        return this.capital.toFixed(0);
    }

    printCapital(): void {
        this.logger.log(`CAPITAL = ${this.getPrettyCapital()}`);
    }
}
