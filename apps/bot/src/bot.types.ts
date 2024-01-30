export type TConfig = {
    logSim: boolean;
    load: boolean;
    ticker: ETicker;
    size: ESize;
    risk: number;
    from: number;
    to: number;
};

export enum ESize {
    DAY = '1d',
    WEEK = '1w',
}

export enum ETicker {
    BTCUSDT = 'BTCUSDT',
    ETHUSDT = 'ETHUSDT',
}
