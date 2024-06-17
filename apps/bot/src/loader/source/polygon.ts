import { ILoader } from '../loader.dto';
import { CandleModel } from '../../data/candle.model';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { config } from '../../bot.config';
import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { sleep } from '../../utils/sleep.util';
import { seconds } from '../../utils/time.util';

type TRawCandles = {
    results: Array<{
        t: number;
        o: number;
        h: number;
        l: number;
        c: number;
    }>;
};

@Injectable()
export class PolygonLoader implements ILoader {
    constructor(private httpService: HttpService) {}

    async loadChunk(from: number, size: string): Promise<Array<CandleModel>> {
        const ticker = config.ticker;
        const urlSize = size === '1d' ? '1/day' : '1/hour';
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${urlSize}/${from}/${Date.now()}`;

        const { data } = await lastValueFrom(
            this.httpService.get<TRawCandles>(url, {
                params: {
                    adjusted: true,
                    sort: 'asc',
                    apiKey: 'EnafoBEUS3KS1YrF6iGWxHtpMEFTA5g9',
                    limit: 10_000,
                },
            }),
        );

        await sleep(seconds(15));

        return data.results.map(({ t: timestamp, o: open, h: high, l: low, c: close }) => ({
            id: config.ticker + size + String(timestamp),
            ticker: config.ticker,
            timestamp,
            dateString: DateTime.fromMillis(timestamp).toFormat('dd-MM-y HH'),
            open,
            high,
            low,
            close,
            microHma: null,
            hma: null,
            midHma: null,
            bigHma: null,
            size,
        }));
    }
}
