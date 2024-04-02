export type TConfig = {
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
}
