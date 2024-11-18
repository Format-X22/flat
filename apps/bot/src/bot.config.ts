import { days, endOfYear, startOfYear } from './utils/time.util';
import { ETicker, TConfig } from './bot.types';

export const config: TConfig = {
    botMode: false,
    printTrades: false,
    makeCsv: false,
    makeTW: false,
    load: false,
    ticker: ETicker.BTCUSDT,
    risk: 33,
    from: startOfYear(2023) + days(0),
    to: endOfYear(2100),
    offset: 0,
};
