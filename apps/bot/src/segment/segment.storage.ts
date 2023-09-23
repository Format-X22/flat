import { TSegment } from './segment.dto';
import { CandleModel, EHmaType } from '../loader/candle.model';

export class SegmentStorage {
    private segments: Array<TSegment> = [
        {
            isUp: null,
            isDown: null,
            size: 0,
            min: Infinity,
            max: -Infinity,
            startDate: null,
            endDate: null,
            candles: [],
        },
    ];

    constructor(private readonly candles: Array<CandleModel>, private readonly hmaField: EHmaType) {}

    addCandle(candle: CandleModel): void {
        const prev1Candle = this.candles[this.candles.length - 2];
        let currentSegment = this.segments[this.segments.length - 1];

        if (!currentSegment.startDate) {
            currentSegment.startDate = candle.dateString;
        }

        if (currentSegment.isUp === true) {
            if (prev1Candle && prev1Candle[this.hmaField] > candle[this.hmaField]) {
                currentSegment.endDate = prev1Candle.dateString;
                currentSegment = null;
            }
        } else if (currentSegment.isDown === true) {
            if (prev1Candle && prev1Candle[this.hmaField] < candle[this.hmaField]) {
                currentSegment.endDate = prev1Candle.dateString;
                currentSegment = null;
            }
        }

        if (!currentSegment) {
            currentSegment = {
                isUp: null,
                isDown: null,
                size: 0,
                min: Infinity,
                max: -Infinity,
                startDate: candle.dateString,
                endDate: null,
                candles: [],
            };
        }

        if (currentSegment.min > candle.low) {
            currentSegment.min = candle.low;
        }

        if (currentSegment.max < candle.high) {
            currentSegment.max = candle.high;
        }

        if (prev1Candle && currentSegment.isUp === null) {
            currentSegment.isUp = prev1Candle[this.hmaField] <= candle[this.hmaField];
            currentSegment.isDown = prev1Candle[this.hmaField] > candle[this.hmaField];
        }

        currentSegment.size++;
        currentSegment.candles.push(candle);

        if (this.getCurrentSegment() !== currentSegment) {
            this.segments.push(currentSegment);
        }
    }

    getCurrentSegment(): TSegment {
        return this.getPrevSegment(0);
    }

    getPrevSegment(index: number): TSegment {
        return this.segments[this.segments.length - 1 - index];
    }
}
