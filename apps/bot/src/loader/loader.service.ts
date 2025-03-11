import { Injectable, Logger } from '@nestjs/common';
import * as tech from 'technicalindicators';
import * as _ from 'lodash';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel, EHmaType } from '../data/candle.model';
import { Repository } from 'typeorm';
import { sleep } from '../utils/sleep.util';
import { DateTime } from 'luxon';
import { config } from '../bot.config';
import { BinanceLoader } from './source/binance';
import { PolygonLoader } from './source/polygon';
import { ILoader } from './loader.dto';
import { BINANCE_TICKERS } from '../bot.types';

const HMA_3 = 3;
const HMA_5 = 5;
const HMA_7 = 7;
const HMA_9 = 9;
const HMA_14 = 14;
const HMA_21 = 21;
const HMA_30 = 30;
const HMA_45 = 45;
const HMA_60 = 60;
const HMA_100 = 100;

@Injectable()
export class LoaderService {
    private readonly logger: Logger = new Logger(LoaderService.name);

    constructor(
        @InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>,
        private binanceLoader: BinanceLoader,
        private polygonLoader: PolygonLoader,
    ) {}

    async truncate(): Promise<void> {
        await this.candleRepo.clear();

        this.logger.log('Truncated');
    }

    async loadActual(): Promise<void> {
        const dayOffset = await this.candleRepo.find({
            take: HMA_100 * 2 + 1,
            order: { timestamp: 'DESC' },
            select: ['timestamp'],
            where: { size: '1d', ticker: config.ticker },
        });
        const hoursOffset = await this.candleRepo.find({
            take: (HMA_100 * 2 + 1) * 24,
            order: { timestamp: 'DESC' },
            select: ['timestamp'],
            where: { size: '1h', ticker: config.ticker },
        });

        if (!dayOffset?.length) {
            await this.load('1d');
        } else {
            await this.load('1d', new Date(dayOffset[dayOffset.length - 1].timestamp - 1000));
        }

        if (!hoursOffset?.length) {
            await this.load('1h', null);
        } else {
            await this.load('1h', new Date(hoursOffset[hoursOffset.length - 1].timestamp - 1000));
        }
    }

    async load(size: string, fromForce?: Date): Promise<void> {
        const rawDataMap = new Map<number, Partial<CandleModel>>();
        let fromDate: Date;

        this.logger.log('Start loading...');

        if (fromForce) {
            fromDate = fromForce;
        } else {
            fromDate = DateTime.fromObject({ year: 2017, day: 11, month: 1 }).toJSDate();
        }

        await this.populateRawDataMap(rawDataMap, fromDate, size);

        this.logger.log('Full data loaded, prepare and calc indicators...');

        const sorted = Array.from(rawDataMap.values()).sort((a, b) => a.timestamp - b.timestamp);

        sorted.pop();

        this.addHma(HMA_3, sorted, EHmaType.HMA_3);
        this.addHma(HMA_5, sorted, EHmaType.HMA_5);
        this.addHma(HMA_7, sorted, EHmaType.HMA_7);
        this.addHma(HMA_9, sorted, EHmaType.HMA_9);
        this.addHma(HMA_14, sorted, EHmaType.HMA_14);
        this.addHma(HMA_21, sorted, EHmaType.HMA_21);
        this.addHma(HMA_30, sorted, EHmaType.HMA_30);
        this.addHma(HMA_45, sorted, EHmaType.HMA_45);
        this.addHma(HMA_60, sorted, EHmaType.HMA_60);
        this.addHma(HMA_100, sorted, EHmaType.HMA_100);

        const resultChunks = _.chunk(
            sorted.filter((i) => i.hma_100),
            1000,
        );

        this.logger.log('Prepare done, save to database...');

        for (const chunk of resultChunks) {
            this.logger.verbose('Put chunk, size ' + chunk.length);
            try {
                await this.candleRepo.upsert(chunk, ['id']);
            } catch (error) {
                this.logger.error(error);
            }
        }

        this.logger.log('Load and save done!');
    }

    private async populateRawDataMap(
        rawDataMap: Map<number, Partial<CandleModel>>,
        fromDate: Date,
        size: string,
    ): Promise<void> {
        let from = Number(fromDate);
        let loader: ILoader;

        if (BINANCE_TICKERS.includes(config.ticker)) {
            loader = this.binanceLoader;
        } else {
            loader = this.polygonLoader;
        }

        while (true) {
            try {
                const loaded = await loader.loadChunk(from, size);

                if (!loaded.length) {
                    break;
                }

                const lastTimestamp = loaded[loaded.length - 1].timestamp;

                if (lastTimestamp === from) {
                    break;
                }

                for (const item of loaded) {
                    rawDataMap.set(item.timestamp, item);
                }

                from = lastTimestamp;

                this.logger.log(
                    'Chunk loaded, last date - ' + DateTime.fromMillis(lastTimestamp).toFormat('dd-MM-y HH'),
                );
            } catch (error) {
                this.logger.error('On load - ' + error);
            } finally {
                await sleep(3000);
            }
        }
    }

    private addHma(period: number, data: Array<Partial<CandleModel>>, field: EHmaType): void {
        const halfPeriod = Math.round(period / 2);
        const sqn = Math.round(Math.sqrt(period));
        const diffs = [];

        for (let i = period - 1; i < data.length; i++) {
            const values = data.slice(i - (period - 1), i + 1).map((i) => i.close);
            const wmaList = tech.wma({ period, values });
            const wma = wmaList[wmaList.length - 1];
            const d2WmaList = tech.wma({ period: halfPeriod, values });
            const d2Wma = d2WmaList[d2WmaList.length - 1] * 2;

            diffs.push(d2Wma - wma);
        }

        for (let i = sqn - 1; i < diffs.length; i++) {
            const values = diffs.slice(i - (sqn - 1), i + 1);
            const hmaList = tech.wma({ period: sqn, values });

            data[i + period - 1][field] = hmaList[hmaList.length - 1];
        }
    }
}
