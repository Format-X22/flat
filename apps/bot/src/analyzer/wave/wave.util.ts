import { TSegment } from './segment.dto';
import { CandleModel } from '../../data/candle.model';
import { InversionUtil } from '../../utils/inversion.util';

export class Wave implements TSegment {
    private readonly inversion: InversionUtil;

    private readonly isUpOriginal: boolean;
    private readonly isDownOriginal: boolean;
    private readonly minOriginal: number;
    private readonly maxOriginal: number;

    startDate: string;
    endDate: string;
    size: number;
    sizeLeft: number;
    sizeRight: number;
    candles: Array<CandleModel>;
    leftCandles: Array<CandleModel>;
    rightCandles: Array<CandleModel>;

    constructor(left: TSegment, right: TSegment | null, private isNotInverted: boolean) {
        this.inversion = new InversionUtil(this.isNotInverted);

        this.isUpOriginal = left.isUp;
        this.isDownOriginal = left.isDown;
        this.minOriginal = Math.min(left.min, right?.min || +Infinity);
        this.maxOriginal = Math.max(left.max, right?.max || -Infinity);
        this.startDate = left.startDate;
        this.endDate = right?.endDate || left.endDate;
        this.sizeLeft = left.size;
        this.sizeRight = right?.size || 0;
        this.size = this.sizeLeft + this.sizeRight;
        this.leftCandles = [...left.candles];
        this.rightCandles = [...(right?.candles || [])];
        this.candles = [...this.leftCandles, ...this.rightCandles];
    }

    get isUp(): boolean {
        return this.inversion.bool(this.isUpOriginal);
    }

    get isDown(): boolean {
        return this.inversion.bool(this.isDownOriginal);
    }

    get min(): number {
        return this.inversion.value(this.minOriginal, this.maxOriginal);
    }

    get max(): number {
        return this.inversion.value(this.maxOriginal, this.minOriginal);
    }

    get minCandle(): CandleModel {
        const cond = (prev: CandleModel, cur: CandleModel) =>
            this.inversion.fn(
                () => prev.low < cur.low,
                () => prev.high > cur.high,
            );

        return this.candles.reduce((prev, cur) => (cond(prev, cur) ? prev : cur));
    }

    get maxCandle(): CandleModel {
        const cond = (prev: CandleModel, cur: CandleModel) =>
            this.inversion.fn(
                () => prev.high > cur.high,
                () => prev.low < cur.low,
            );

        return this.candles.reduce((prev, cur) => (cond(prev, cur) ? prev : cur));
    }

    maxGt(value: number): boolean {
        return this.inversion.fn(
            () => this.maxOriginal > value,
            () => this.minOriginal < value,
        );
    }

    maxGte(value: number): boolean {
        return this.inversion.fn(
            () => this.maxOriginal >= value,
            () => this.minOriginal <= value,
        );
    }

    maxLt(value: number): boolean {
        return this.inversion.fn(
            () => this.maxOriginal < value,
            () => this.minOriginal > value,
        );
    }

    maxLte(value: number): boolean {
        return this.inversion.fn(
            () => this.maxOriginal <= value,
            () => this.minOriginal >= value,
        );
    }

    minGt(value: number): boolean {
        return this.inversion.fn(
            () => this.minOriginal > value,
            () => this.maxOriginal < value,
        );
    }

    minGte(value: number): boolean {
        return this.inversion.fn(
            () => this.minOriginal >= value,
            () => this.maxOriginal <= value,
        );
    }

    minLt(value: number): boolean {
        return this.inversion.fn(
            () => this.minOriginal < value,
            () => this.maxOriginal > value,
        );
    }

    minLte(value: number): boolean {
        return this.inversion.fn(
            () => this.minOriginal <= value,
            () => this.maxOriginal >= value,
        );
    }
}
