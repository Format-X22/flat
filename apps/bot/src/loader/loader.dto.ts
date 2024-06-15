import { CandleModel } from '../data/candle.model';

export interface ILoader {
    loadChunk(from: number, size: string): Promise<Array<CandleModel>>;
}
