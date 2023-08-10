import { TSegment } from './calculator.types';
import { CandleModel } from '../loader/candle.model';

export class SegmentUtil {
    private segments: Array<TSegment> = [
        {
            isUp: null,
            size: 0,
            min: Infinity,
            max: -Infinity,
            startDate: null,
            endDate: null,
        },
    ];
    private candles: Array<CandleModel> = [];

    addCandle(candle: CandleModel): void {
        this.candles.push(candle);

        const prev1Candle = this.candles[this.candles.length - 2];
        let currentSegment = this.segments[this.segments.length - 1];

        if (!currentSegment.startDate) {
            currentSegment.startDate = candle.dateString;
        }

        if (currentSegment.isUp === true) {
            if (prev1Candle && prev1Candle.hma > candle.hma) {
                currentSegment.endDate = prev1Candle.dateString;
                currentSegment = null;
            }
        } else if (currentSegment.isUp === false) {
            if (prev1Candle && prev1Candle.hma < candle.hma) {
                currentSegment.endDate = prev1Candle.dateString;
                currentSegment = null;
            }
        }

        if (!currentSegment) {
            currentSegment = {
                isUp: null,
                size: 0,
                min: Infinity,
                max: -Infinity,
                startDate: candle.dateString,
                endDate: null,
            };
        }

        if (currentSegment.min > candle.low) {
            currentSegment.min = candle.low;
        }

        if (currentSegment.max < candle.high) {
            currentSegment.max = candle.high;
        }

        if (prev1Candle && currentSegment.isUp === null) {
            currentSegment.isUp = prev1Candle.hma <= candle.hma;
        }

        currentSegment.size++;

        if (this.getCurrentSegment() !== currentSegment) {
            this.segments.push(currentSegment);
        }
    }

    isSegmentChanged(): boolean {
        return this.getCurrentSegment().size === 1;
    }

    getCurrentSegment(): TSegment {
        return this.getPrevSegment(0);
    }

    getPrevSegment(index: number): TSegment {
        return this.segments[this.segments.length - 1 - index];
    }
}
