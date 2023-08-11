import { TSegment } from './calculator.types';
import { CandleModel } from '../loader/candle.model';

export class SegmentUtil {
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
        } else if (currentSegment.isDown === true) {
            if (prev1Candle && prev1Candle.hma < candle.hma) {
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
            currentSegment.isUp = prev1Candle.hma <= candle.hma;
            currentSegment.isDown = prev1Candle.hma > candle.hma;
        }

        currentSegment.size++;
        currentSegment.candles.push(candle);

        if (this.getCurrentSegment() !== currentSegment) {
            this.segments.push(currentSegment);
        }
    }

    isDirectionChanged(): boolean {
        return this.getCurrentSegment().size === 1;
    }

    getCurrentSegment(): TSegment {
        return this.getPrevSegment(0);
    }

    getPrevSegment(index: number): TSegment {
        return this.segments[this.segments.length - 1 - index];
    }

    getCurrentCandle(): CandleModel {
        return this.candles[this.candles.length - 1];
    }

    getSegments(count: number): Array<TSegment> {
        const result = [];

        for (let i = 0; i < count; i++) {
            result.push(this.getPrevSegment(i));
        }

        return result;
    }
}
