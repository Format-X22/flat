import { Injectable, Logger } from '@nestjs/common';
import * as tech from 'technicalindicators';
import * as _ from 'lodash';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel, EHmaType } from '../data/candle.model';
import { Repository } from 'typeorm';
import { sleep } from '../utils/sleep.util';
import { DateTime } from 'luxon';
import { config } from '../bot.config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

const HMA_PERIOD = 7;
const MID_HMA_PERIOD = 14;
const BIG_HMA_PERIOD = 30;

@Injectable()
export class LoaderService {
    private readonly logger: Logger = new Logger(LoaderService.name);

    constructor(
        @InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>,
        private httpService: HttpService,
    ) {}

    async truncate(): Promise<void> {
        await this.candleRepo.clear();

        this.logger.log('Truncated');
    }

    async loadActual(): Promise<void> {
        const dayOffset = await this.candleRepo.find({
            take: BIG_HMA_PERIOD * 2 + 1,
            order: { timestamp: 'DESC' },
            select: ['timestamp'],
            where: { size: '1d', ticker: config.ticker },
        });
        const hoursOffset = await this.candleRepo.find({
            take: BIG_HMA_PERIOD * 2 + 1,
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

        this.addHma(HMA_PERIOD, sorted, EHmaType.HMA);
        this.addHma(MID_HMA_PERIOD, sorted, EHmaType.MID_HMA);
        this.addHma(BIG_HMA_PERIOD, sorted, EHmaType.BIG_HMA);

        const resultChunks = _.chunk(
            sorted.filter((i) => i.bigHma),
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

        while (true) {
            try {
                const loaded = await this.loadChunk(from, size);

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

    private async loadChunk(from: number, size: string): Promise<Array<Partial<CandleModel>>> {
        const fromTimestamp = Number(from);

        const { data } = await lastValueFrom(
            this.httpService.get<Array<[number, string, string, string, string]>>(
                'https://data-api.binance.vision/api/v3/klines',
                {
                    params: {
                        symbol: config.ticker,
                        interval: '1d',
                        startTime: fromTimestamp,
                    },
                },
            ),
        );

        return data.map((item) => ({
            id: config.ticker + size + String(item[0]),
            ticker: config.ticker,
            timestamp: Number(item[0]),
            dateString: DateTime.fromMillis(Number(item[0])).toFormat('dd-MM-y HH'),
            open: Number(item[1]),
            high: Number(item[2]),
            low: Number(item[3]),
            close: Number(item[4]),
            microHma: null,
            hma: null,
            midHma: null,
            bigHma: null,
            size,
        }));
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
