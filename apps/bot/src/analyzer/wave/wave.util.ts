import { TSegment } from '../segment/segment.dto';
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
        if (this.isNotInverted) {
            return this.isUpOriginal;
        } else {
            return !this.isUpOriginal;
        }
    }

    get isDown(): boolean {
        if (this.isNotInverted) {
            return this.isDownOriginal;
        } else {
            return !this.isDownOriginal;
        }
    }

    get min(): number {
        if (this.isNotInverted) {
            return this.minOriginal;
        } else {
            return this.maxOriginal;
        }
    }

    get max(): number {
        if (this.isNotInverted) {
            return this.maxOriginal;
        } else {
            return this.minOriginal;
        }
    }

    maxGt(value: number): boolean {
        if (this.isNotInverted) {
            return this.maxOriginal > value;
        } else {
            return this.minOriginal < value;
        }
    }

    maxGte(value: number): boolean {
        if (this.isNotInverted) {
            return this.maxOriginal >= value;
        } else {
            return this.minOriginal <= value;
        }
    }

    maxLt(value: number): boolean {
        if (this.isNotInverted) {
            return this.maxOriginal < value;
        } else {
            return this.minOriginal > value;
        }
    }

    maxLte(value: number): boolean {
        if (this.isNotInverted) {
            return this.maxOriginal <= value;
        } else {
            return this.minOriginal >= value;
        }
    }

    minGt(value: number): boolean {
        if (this.isNotInverted) {
            return this.minOriginal > value;
        } else {
            return this.maxOriginal < value;
        }
    }

    minGte(value: number): boolean {
        if (this.isNotInverted) {
            return this.minOriginal >= value;
        } else {
            return this.maxOriginal <= value;
        }
    }

    minLt(value: number): boolean {
        if (this.isNotInverted) {
            return this.minOriginal < value;
        } else {
            return this.maxOriginal > value;
        }
    }

    minLte(value: number): boolean {
        if (this.isNotInverted) {
            return this.minOriginal <= value;
        } else {
            return this.maxOriginal >= value;
        }
    }
}
