import { TSegment } from './segment.dto';
import { CandleModel } from '../../data/candle.model';

export class Wave implements TSegment {
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

    constructor(left: TSegment, right: TSegment | null, private isNotInverted: boolean) {
        this.isUpOriginal = left.isUp;
        this.isDownOriginal = left.isDown;
        this.minOriginal = Math.min(left.min, right?.min || +Infinity);
        this.maxOriginal = Math.max(left.max, right?.max || -Infinity);
        this.startDate = left.startDate;
        this.endDate = right?.endDate || left.endDate;
        this.sizeLeft = left.size;
        this.sizeRight = right?.size || 0;
        this.size = this.sizeLeft + this.sizeRight;
        this.candles = [...left.candles, ...(right?.candles || [])];
    }

    get isUp(): boolean {
        return this.boolInversion(this.isUpOriginal);
    }

    get isDown(): boolean {
        return this.boolInversion(this.isDownOriginal);
    }

    get min(): number {
        return this.valueInversion(this.minOriginal, this.maxOriginal);
    }

    get max(): number {
        return this.valueInversion(this.maxOriginal, this.minOriginal);
    }

    get minCandle(): CandleModel {
        const cond = (prev: CandleModel, cur: CandleModel) =>
            this.valueInversionFn(
                () => prev.low < cur.low,
                () => prev.high > cur.high,
            );

        return this.candles.reduce((prev, cur) => (cond(prev, cur) ? prev : cur));
    }

    get maxCandle(): CandleModel {
        const cond = (prev: CandleModel, cur: CandleModel) =>
            this.valueInversionFn(
                () => prev.high > cur.high,
                () => prev.low < cur.low,
            );

        return this.candles.reduce((prev, cur) => (cond(prev, cur) ? prev : cur));
    }

    maxGt(value: number): boolean {
        return this.valueInversionFn(
            () => this.maxOriginal > value,
            () => this.minOriginal < value,
        );
    }

    maxGte(value: number): boolean {
        return this.valueInversionFn(
            () => this.maxOriginal >= value,
            () => this.minOriginal <= value,
        );
    }

    maxLt(value: number): boolean {
        return this.valueInversionFn(
            () => this.maxOriginal < value,
            () => this.minOriginal > value,
        );
    }

    maxLte(value: number): boolean {
        return this.valueInversionFn(
            () => this.maxOriginal <= value,
            () => this.minOriginal >= value,
        );
    }

    minGt(value: number): boolean {
        return this.valueInversionFn(
            () => this.minOriginal > value,
            () => this.maxOriginal < value,
        );
    }

    minGte(value: number): boolean {
        return this.valueInversionFn(
            () => this.minOriginal >= value,
            () => this.maxOriginal <= value,
        );
    }

    minLt(value: number): boolean {
        return this.valueInversionFn(
            () => this.minOriginal < value,
            () => this.maxOriginal > value,
        );
    }

    minLte(value: number): boolean {
        return this.valueInversionFn(
            () => this.minOriginal <= value,
            () => this.maxOriginal >= value,
        );
    }

    private boolInversion(flag: boolean): boolean {
        return this.isNotInverted ? flag : !flag;
    }

    private valueInversion<T1, T2>(a: T1, b: T2): T1 | T2 {
        return this.isNotInverted ? a : b;
    }

    private valueInversionFn<T1, T2>(a: () => T1, b: () => T2): T1 | T2 {
        return this.isNotInverted ? a() : b();
    }
}
