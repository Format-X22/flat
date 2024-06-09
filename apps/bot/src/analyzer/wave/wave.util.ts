import { TSegment } from './segment.dto';
import { CandleModel } from '../../data/candle.model';

export class Wave implements TSegment {
    static getWaves(
        count: number,
        firstIsUp: boolean,
        isUpStrategy: boolean,
        getSegments: (count: number) => Array<TSegment>,
    ): Array<Wave> {
        const required = count * 2;
        const segments = getSegments(required);

        if (!segments[required - 1]) {
            return new Array(required);
        }

        const current = segments[0];
        const waves = [];

        if ((firstIsUp && current.isUp) || (!firstIsUp && !current.isUp)) {
            waves.push(new Wave(current, null, isUpStrategy));
        }

        for (let i = 0; i < required - 1; i++) {
            waves.push(new Wave(segments[i + 1], segments[i], isUpStrategy));
        }

        return waves;
    }

    readonly isUp: boolean;
    readonly isDown: boolean;
    readonly min: number;
    readonly max: number;

    startDate: string;
    endDate: string;
    size: number;
    sizeLeft: number;
    sizeRight: number;
    candles: Array<CandleModel>;

    constructor(left: TSegment, right: TSegment | null, private isNotInverted: boolean) {
        this.isUp = left.isUp;
        this.isDown = left.isDown;
        this.min = Math.min(left.min, right?.min || +Infinity);
        this.max = Math.max(left.max, right?.max || -Infinity);
        this.startDate = left.startDate;
        this.endDate = right?.endDate || left.endDate;
        this.sizeLeft = left.size;
        this.sizeRight = right?.size || 0;
        this.size = this.sizeLeft + this.sizeRight;
        this.candles = [...left.candles, ...(right?.candles || [])];
    }

    get minCandle(): CandleModel {
        return this.candles.reduce((prev, cur) => (prev.low < cur.low ? prev : cur));
    }

    get maxCandle(): CandleModel {
        return this.candles.reduce((prev, cur) => (prev.high > cur.high ? prev : cur));
    }
}
