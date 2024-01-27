import { endOfYear, startOfYear } from './utils/time.util';
import { ESize, TConfig } from './bot.types';

export const config: TConfig = {
    logSim: false,
    load: true,
    size: ESize.DAY,
    risk: 33,
    from: startOfYear(2023),
    to: endOfYear(2100),
};
