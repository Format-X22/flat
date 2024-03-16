import { endOfYear, startOfYear } from './utils/time.util';
import { ETicker, TConfig } from './bot.types';

// TODO Треугольники можно анализировать ещё когда одна из волн
// совсем чуть-чуть выходит за другую

export const config: TConfig = {
    logSim: true,
    load: false,
    ticker: ETicker.BTCUSDT,
    risk: 33,
    from: startOfYear(2019),
    to: endOfYear(2100),
};
