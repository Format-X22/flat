import { Injectable } from '@nestjs/common';
import { SegmentService } from '../segment/segment.service';
import { TDetections } from './detector.dto';
import { DownFlagDetect, UpFlagDetect } from './detect/flag.detect';
import { DownBreakDetect, UpBreakDetect } from './detect/break.detect';
import { DownTriangleDetect, UpTriangleDetect } from './detect/triangle.detect';
import { DownZigzagDetect, UpZigzagDetect } from './detect/zigzag.detect';
import { DownRestartDetect, UpRestartDetect } from './detect/restart.detect';

@Injectable()
export class DetectorService {
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

    constructor(private readonly segmentService: SegmentService) {
        this.upFlagDetect = new UpFlagDetect(segmentService);
        this.downFlagDetect = new DownFlagDetect(segmentService);
        this.upBreakDetect = new UpBreakDetect(segmentService);
        this.downBreakDetect = new DownBreakDetect(segmentService);
        this.upTriangleDetect = new UpTriangleDetect(segmentService);
        this.downTriangleDetect = new DownTriangleDetect(segmentService);
        this.upZigzagDetect = new UpZigzagDetect(segmentService);
        this.downZigzagDetect = new DownZigzagDetect(segmentService);
        this.upRestartDetect = new UpRestartDetect(segmentService);
        this.downRestartDetect = new DownRestartDetect(segmentService);
    }

    detect(): TDetections {
        return {
            upFlag: this.checkUpFlag(),
            downFlag: this.checkDownFlag(),
            upBreak: this.checkUpBreak(),
            downBreak: this.checkDownBreak(),
            upTriangle: this.checkUpTriangle(),
            downTriangle: this.checkDownTriangle(),
            upZigzag: this.checkUpZigzag(),
            downZigzag: this.checkDownZigzag(),
            upRestart: this.checkUpRestart(),
            downRestart: this.checkDownRestart(),
        };
    }

    private checkUpFlag(): boolean {
        return this.upFlagDetect.check();
    }

    private checkDownFlag(): boolean {
        return this.downFlagDetect.check();
    }

    private checkUpBreak(): boolean {
        return this.upBreakDetect.check();
    }

    private checkDownBreak(): boolean {
        return this.downBreakDetect.check();
    }

    private checkUpTriangle(): boolean {
        return this.upTriangleDetect.check();
    }

    private checkDownTriangle(): boolean {
        return this.downTriangleDetect.check();
    }

    private checkUpZigzag(): boolean {
        return this.upZigzagDetect.check();
    }

    private checkDownZigzag(): boolean {
        return this.downZigzagDetect.check();
    }

    private checkUpRestart(): boolean {
        return this.upRestartDetect.check();
    }

    private checkDownRestart(): boolean {
        return this.downRestartDetect.check();
    }
}
