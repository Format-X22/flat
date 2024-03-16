export type TConfig = {
    logSim: boolean;
    load: boolean;
    ticker: ETicker;
    risk: number;
    from: number;
    to: number;
};

export enum ETicker {
    BTCUSDT = 'BTCUSDT',
    ETHUSDT = 'ETHUSDT',
}
