import { Injectable } from '@nestjs/common';
import { CandleModel, EHmaType } from '../../data/candle.model';
import { TSegment } from './segment.dto';
import { SegmentStorage } from './segment.storage';

@Injectable()
export class SegmentService {
    private readonly segments: SegmentStorage;
    private readonly midSegments: SegmentStorage;
    private readonly bigSegments: SegmentStorage;

    candles: Array<CandleModel> = [];

    constructor() {
        this.segments = new SegmentStorage(this.candles, EHmaType.HMA);
        this.midSegments = new SegmentStorage(this.candles, EHmaType.MID_HMA);
        this.bigSegments = new SegmentStorage(this.candles, EHmaType.BIG_HMA);
    }

    addCandle(candle: CandleModel): void {
        this.candles.push(candle);

        this.segments.addCandle(candle);
        this.midSegments.addCandle(candle);
        this.bigSegments.addCandle(candle);
    }

    getCurrentCandle(): CandleModel {
        return this.candles[this.candles.length - 1];
    }

    getPrevSegment(index: number, type: EHmaType): TSegment {
        switch (type) {
            case EHmaType.HMA:
                return this.segments.getPrevSegment(index);
            case EHmaType.MID_HMA:
                return this.midSegments.getPrevSegment(index);
            case EHmaType.BIG_HMA:
                return this.bigSegments.getPrevSegment(index);
        }
    }

    getSegments(count: number, type: EHmaType): Array<TSegment> {
        const result: Array<TSegment> = [];

        for (let i = 0; i < count; i++) {
            result.push(this.getPrevSegment(i, type));
        }

        return result;
    }

    getFib(first: number, last: number, val: number, firstIsMax: boolean): number {
        const zone = Math.abs(first - last);
        const min = firstIsMax ? last : first;
        const mul = firstIsMax ? val : 1 - val;

        return zone * mul + min;
    }
}
