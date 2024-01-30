import { endOfYear, startOfYear } from './utils/time.util';
import { ESize, ETicker, TConfig } from './bot.types';

export const config: TConfig = {
    logSim: true,
    load: true,
    ticker: ETicker.BTCUSDT,
    size: ESize.DAY,
    risk: 33,
    from: startOfYear(2023),
    to: endOfYear(2100),
};
