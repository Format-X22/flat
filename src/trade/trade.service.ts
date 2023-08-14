import { Injectable, Logger } from '@nestjs/common';
import { ESide, TOrder } from './trade.dto';
import { SegmentService } from '../segment/segment.service';
import { DetectorService } from '../detector/detector.service';

@Injectable()
export class TradeService {
    private static makeEmptyOrder(side: ESide): TOrder {
        return {
            isActive: false,
            side,
            enter: null,
            take: null,
            stop: null,
            enterDate: null,
            toZeroDate: null,
            priceUnderZero: null,
        }
    }

    private logger: Logger = new Logger(TradeService.name);
    private orderId = 0;

    upFlag: TOrder = TradeService.makeEmptyOrder(ESide.LONG);
    downFlag: TOrder = TradeService.makeEmptyOrder(ESide.SHORT);
    upTrendBreak: TOrder = TradeService.makeEmptyOrder(ESide.SHORT);
    downTrendBreak: TOrder = TradeService.makeEmptyOrder(ESide.LONG);
    upTriangleBreak: TOrder = TradeService.makeEmptyOrder(ESide.LONG);
    downTriangleBreak: TOrder = TradeService.makeEmptyOrder(ESide.SHORT);
    upTriangleBack: TOrder = TradeService.makeEmptyOrder(ESide.SHORT);
    downTriangleBack: TOrder = TradeService.makeEmptyOrder(ESide.LONG);
    upRestartTrend: TOrder = TradeService.makeEmptyOrder(ESide.LONG);
    downRestartTrend: TOrder = TradeService.makeEmptyOrder(ESide.SHORT);
    
    private inPosition = false;

    constructor(private readonly segmentService: SegmentService, private readonly detectorService: DetectorService) {}

    tick(): void {
        if (this.inPosition) {
            this.handlePosition();
        }

        // Check again
        if (this.inPosition) {
            return;
        }

        const detections = this.detectorService.detect();

        // TODO Check priority

        if (detections.upFlag) {
            // TODO -
        }
        if (detections.downFlag) {
            // TODO -
        }
        if (detections.upTrendBreak) {
            // TODO -
        }
        if (detections.downTrendBreak) {
            // TODO -
        }
        if (detections.upTriangleBreak) {
            // TODO -
        }
        if (detections.downTriangleBreak) {
            // TODO -
        }
        if (detections.upTriangleBack) {
            // TODO -
        }
        if (detections.downTriangleBack) {
            // TODO -
        }
        if (detections.upRestartTrend) {
            // TODO -
        }
        if (detections.downRestartTrend) {
            // TODO -
        }
    }

    private handlePosition(): void {
        // TODO -
    }

    private makeId(): number {
        return this.orderId++;
    }
}
