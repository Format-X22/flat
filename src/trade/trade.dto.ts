export enum ESide {
    LONG = 'LONG',
    SHORT = 'SHORT',
}

export type TOrder = {
    isActive: boolean;
    side: ESide,
    enter: number,
    take: number,
    stop: number,
    enterDate: number,
    toZeroDate: number,
    priceUnderZero: boolean;
}