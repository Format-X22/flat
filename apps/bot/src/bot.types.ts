export type TConfig = {
    botMode: boolean;
    printTrades: boolean;
    makeCsv: boolean;
    makeTW: boolean;
    load: boolean;
    ticker: ETicker;
    risk: number;
    from: number;
    to: number;
    offset: number;
};

export enum ETicker {
    BTCUSDT = 'BTCUSDT',
    AAPL = 'AAPL',
    EBAY = 'EBAY',
    UAL = 'UAL',
    EURUSD = 'C:EURUSD',
    MDB = 'MDB',
}

export const BINANCE_TICKERS = [ETicker.BTCUSDT];
export const NEW_YORK_TICKERS = [ETicker.AAPL, ETicker.EBAY, ETicker.UAL, ETicker.EURUSD, ETicker.MDB];
