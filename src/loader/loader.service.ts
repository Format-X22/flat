import { Injectable, Logger } from '@nestjs/common';
import * as ccxt from 'ccxt';
import * as tech from 'technicalindicators';
import * as _ from 'lodash';
import Exchange from 'ccxt/js/src/abstract/binance';
import { InjectRepository } from '@nestjs/typeorm';
import { CandleModel } from './candle.model';
import { Repository } from 'typeorm';
import { sleep } from '../sleep.util';
import { DateTime } from 'luxon';

const HMA_PERIOD = 7;

@Injectable()
export class LoaderService {
    private readonly logger: Logger = new Logger(LoaderService.name);

    constructor(@InjectRepository(CandleModel) private candleRepo: Repository<CandleModel>) {}

    async load(size: string): Promise<void> {
        const rawDataMap = new Map<number, Partial<CandleModel>>();
        const stock = new ccxt.binance();
        const fromDate = new Date();

        this.logger.log('Start loading...');

        fromDate.setFullYear(2017, 11, 31 - (HMA_PERIOD - 1));

        await this.populateRawDataMap(rawDataMap, fromDate, stock, size);

        this.logger.log('Full data loaded, prepare and calc indicators...');

        const sorted = Array.from(rawDataMap.values()).sort((a, b) => a.timestamp - b.timestamp);

        this.addHma(HMA_PERIOD, sorted);

        const resultChunks = _.chunk(
            sorted.filter((i) => i.hma),
            1000,
        );

        this.logger.log('Prepare done, save to database...');

        for (const chunk of resultChunks) {
            await this.candleRepo.insert(chunk);
        }

        this.logger.log('Load and save done!');
    }

    private async populateRawDataMap(
        rawDataMap: Map<number, Partial<CandleModel>>,
        fromDate: Date,
        stock: Exchange,
        size: string,
    ): Promise<void> {
        let from = Number(fromDate);

        while (true) {
            try {
                const loaded = await this.loadChunk(stock, from, size);

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
                await sleep(1000);
            }
        }
    }

    private async loadChunk(stock: Exchange, from: number, size: string): Promise<Array<Partial<CandleModel>>> {
        const fromTimestamp = Number(from);

        const chunk = await stock.fetchOHLCV('BTCUSDT', size, fromTimestamp, 100);

        if (!chunk || !chunk.length) {
            return;
        }

        return chunk.map((item) => ({
            timestamp: Number(item[0]),
            dateString: DateTime.fromMillis(Number(item[0])).toFormat('dd-MM-y HH'),
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4],
            hma: null,
            size,
        }));
    }

    private addHma(period: number, data: Array<Partial<CandleModel>>): void {
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

            data[i + period - 1].hma = hmaList[hmaList.length - 1];
        }
    }
}
