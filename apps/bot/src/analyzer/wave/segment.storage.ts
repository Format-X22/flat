import { TSegment } from './segment.dto';
import { CandleModel, EHmaType } from '../../data/candle.model';

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
        const prev1Candle = this.candles.at(-2);
        const prev2Candle = this.candles.at(-3);
        let currentSegment = this.segments.at(-1);
        const prevHma = prev1Candle?.[this.hmaField];
        const currentHma = candle[this.hmaField];
        let newDetected = false;

        if (!currentSegment.startDate) {
            currentSegment.startDate = candle.dateString;
        }

        if (currentSegment.isUp === true) {
            if (prev1Candle && prevHma > currentHma) {
                newDetected = true;
            }
        } else if (currentSegment.isDown === true) {
            if (prev1Candle && prevHma < currentHma) {
                newDetected = true;
            }
        }

        if (newDetected) {
            currentSegment.candles.pop();
            currentSegment.endDate = prev2Candle.dateString;

            currentSegment = {
                isUp: null,
                isDown: null,
                size: 1,
                min: prev1Candle.low,
                max: prev1Candle.high,
                startDate: prev1Candle.dateString,
                endDate: null,
                candles: [prev1Candle],
            };
        }

        if (currentSegment.min > candle.low) {
            currentSegment.min = candle.low;
        }

        if (currentSegment.max < candle.high) {
            currentSegment.max = candle.high;
        }

        if (prev1Candle) {
            currentSegment.isUp = prevHma <= currentHma;
            currentSegment.isDown = prevHma > currentHma;
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
