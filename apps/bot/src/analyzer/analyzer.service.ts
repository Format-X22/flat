import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel } from '../data/candle.model';
import { Between, Repository } from 'typeorm';
import { TActualOrder } from './detector/detector.dto';
import { days, hours, millis } from '../utils/time.util';
import { TCalcArgs } from './analyzer.dto';
import { config } from '../bot.config';
import { SegmentUtil } from './wave/segment.util';
import { DetectorExecutor } from './detector/detector.executor';
import { ReportUtil } from './report/report.util';

@Injectable()
export class AnalyzerService {
    constructor(@InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>) {}

    async calc({ risk, from, to }: TCalcArgs): Promise<TActualOrder> {
        const segmentUtil = new SegmentUtil();
        const reportUtil = new ReportUtil();
        const detectorExecutor = new DetectorExecutor(segmentUtil, reportUtil);
        const candles = await this.getCandles();

        for (const candle of candles) {
            const offset = days(1) - millis(1);
            const innerCandles = await this.getInnerCandles(
                candle.timestamp + hours(config.offset),
                candle.timestamp + hours(config.offset) + offset,
            );

            segmentUtil.addCandle(candle, innerCandles);

            if (!this.isInTestRange(candle, from, to)) {
                continue;
            }

            detectorExecutor.detect(risk);
        }

        detectorExecutor.reportCapital();

        if (config.printTrades) {
            reportUtil.printTrade(new Set(['ALL']));
        }

        if (config.makeTW) {
            reportUtil.makeTradingViewScript();
        }

        if (config.makeCsv) {
            reportUtil.makeCsvFile();
            reportUtil.makeRiskArrayFile();
            reportUtil.makeProfitArrayFile();
            reportUtil.makeProfitByMonthArrayFile();
        }

        detectorExecutor.printLastOrders();

        return detectorExecutor.getOrders();
    }

    private async getCandles(): Promise<Array<CandleModel>> {
        return this.candleRepo.find({
            where: { size: '1d', ticker: config.ticker },
            order: { timestamp: 'ASC' },
        });
    }

    private async getInnerCandles(from: number, to: number): Promise<Array<CandleModel>> {
        return this.candleRepo.find({
            where: { size: '1h', timestamp: Between(from, to), ticker: config.ticker },
            order: { timestamp: 'ASC' },
        });
    }

    private isInTestRange(candle: CandleModel, from: number, to: number): boolean {
        return candle.timestamp > from && candle.timestamp < to;
    }
}
