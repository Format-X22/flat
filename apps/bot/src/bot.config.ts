import { endOfYear, startOfYear } from './utils/time.util';
import { ETicker, TConfig } from './bot.types';

export const config: TConfig = {
    botMode: false,
    printTrades: true,
    makeCsv: false,
    makeTW: false,
    load: false,
    ticker: ETicker.BTCUSDT,
    risk: 33,
    from: startOfYear(2019),
    to: endOfYear(2100),
    offset: 9,
};
