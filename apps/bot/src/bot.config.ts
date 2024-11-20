import { days, endOfYear, startOfYear } from './utils/time.util';
import { ETicker, TConfig } from './bot.types';

export const config: TConfig = {
    botMode: false,
    printTrades: true,
    makeCsv: false,
    makeTW: false,
    load: false,
    ticker: ETicker.BTCUSDT,
    risk: 50,
    from: startOfYear(2024) + days(30 * 8),
    to: endOfYear(2100),
    offset: 0,
};
