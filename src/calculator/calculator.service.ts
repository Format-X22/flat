import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel } from '../loader/candle.model';
import { Repository } from 'typeorm';
import { SegmentUtil } from './segment.util';
import { DetectorUtil } from './detector.util';

// TODO Filtrate flags with mass near border
// TODO Filtrate super compact restart trend

@Injectable()
export class CalculatorService {
    private readonly logger: Logger = new Logger(CalculatorService.name);

    constructor(@InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>) {}

    async calc(): Promise<void> {
        const segmentUtil = new SegmentUtil();
        const detectorUtil = new DetectorUtil(segmentUtil);
        const candles = await this.getCandles('1d');

        for (const candle of candles) {
            segmentUtil.addCandle(candle);

            if (!this.isInTestRange(candle)) {
                continue;
            }

            const upFlagDetected = detectorUtil.checkUpFlag();
            const downFlagDetected = detectorUtil.checkDownFlag();

            const upTrendBreakDetected = detectorUtil.checkUpTrendBreak();
            const downTrendBreakDetected = detectorUtil.checkDownTrendBreak();

            const upTriangleBreakDetected = detectorUtil.checkUpTriangleBreak();
            const downTriangleBreakDetected = detectorUtil.checkDownTriangleBreak();

            const upTriangleBackDetected = detectorUtil.checkUpTriangleBack();
            const downTriangleBackDetected = detectorUtil.checkDownTriangleBack();

            const upRestartTrendDetected = detectorUtil.checkUpRestartTrend();
            const downRestartTrendDetected = detectorUtil.checkDownRestartTrend();

            const upMicroWaveDetected = detectorUtil.checkUpMicroWave();
            const downMicroWaveDetected = detectorUtil.checkDownMicroWave();

            // TODO -
        }

        // TODO -
    }

    private getCandles(size: string): Promise<Array<CandleModel>> {
        return this.candleRepo.find({ where: { size }, order: { timestamp: 'ASC' } });
    }

    private isInTestRange(candle: CandleModel): boolean {
        return candle.timestamp > 1659372330916;
    }
}
