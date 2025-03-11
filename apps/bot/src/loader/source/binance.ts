import { CandleModel } from '../../data/candle.model';
import { lastValueFrom } from 'rxjs';
import { config } from '../../bot.config';
import { DateTime } from 'luxon';
import { ILoader } from '../loader.dto';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

type TRawCandles = Array<[timestamp: number, open: string, high: string, low: string, close: string]>;

@Injectable()
export class BinanceLoader implements ILoader {
    constructor(private httpService: HttpService) {}

    async loadChunk(from: number, size: string): Promise<Array<CandleModel>> {
        const fromTimestamp = Number(from);

        const { data } = await lastValueFrom(
            this.httpService.get<TRawCandles>('https://data-api.binance.vision/api/v3/klines', {
                params: {
                    symbol: config.ticker,
                    interval: size,
                    startTime: fromTimestamp,
                },
            }),
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
            hma_3: null,
            hma_5: null,
            hma_7: null,
            hma_9: null,
            hma_14: null,
            hma_21: null,
            hma_30: null,
            hma_45: null,
            hma_60: null,
            hma_100: null,
            size,
        }));
    }
}
