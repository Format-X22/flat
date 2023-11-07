export enum EDirection {
    UP = 'UP',
    DOWN = 'DOWN',
}

export type TOrder = {
    direction: EDirection;
    enter: number;
    take: number;
    stop: number;
    risk: number;
};

export type TStockOrderId = string | number;
export type TStockPositionId = string | number;
