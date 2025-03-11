import { SegmentStorage } from './segment.storage';
import { CandleModel, EHmaType } from '../../data/candle.model';
import { TSegment } from './segment.dto';

export class SegmentUtil {
    private readonly segmentsMap: Map<EHmaType, SegmentStorage> = new Map();

    candles: Array<CandleModel> = [];
    innerCandles: Array<Array<CandleModel>> = [];

    constructor() {
        for (const typeName of Object.keys(EHmaType)) {
            const type = typeName as EHmaType;

            this.segmentsMap.set(type, new SegmentStorage(this.candles, EHmaType[type]));
        }
    }

    addCandle(candle: CandleModel, innerCandles: Array<CandleModel>): void {
        this.candles.push(candle);
        this.innerCandles.push(innerCandles);

        for (const segments of this.segmentsMap.values()) {
            segments.addCandle(candle);
        }
    }

    getCurrentCandle(): CandleModel {
        return this.candles[this.candles.length - 1];
    }

    getCurrentInnerCandles(): Array<CandleModel> {
        return this.innerCandles[this.innerCandles.length - 1];
    }

    getPrevSegment(index: number, type: EHmaType): TSegment {
        return this.segmentsMap.get(type).getPrevSegment(index);
    }

    getSegments(count: number, type: EHmaType): Array<TSegment> {
        const result: Array<TSegment> = [];

        for (let i = 0; i < count; i++) {
            result.push(this.getPrevSegment(i, type));
        }

        return result;
    }

    getFib(first: number, last: number, val: number): number {
        const zone = Math.abs(first - last);
        const min = Math.min(first, last);
        const mul = min === last ? val : 1 - val;

        return zone * mul + min;
    }
}
