import { CandleModel } from '../../data/candle.model';

export type TSegment = {
    isUp: boolean;
    isDown: boolean;
    size: number;
    min: number;
    max: number;
    startDate: string;
    endDate: string;
    candles: Array<CandleModel>;
};
