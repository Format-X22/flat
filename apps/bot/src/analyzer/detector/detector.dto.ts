export enum ESide {
    UP = 'UP',
    DOWN = 'DOWN',
}

export type TOrder = {
    isActive: boolean;
    side: ESide;
    enter: number;
    limit: number;
    take: number;
    stop: number;
    proportion: number;
    enterDate: string;
    waitDays: number;
};

export type TActualOrder = {
    up: TOrder;
    down: TOrder;
};

export type TActualOrderWithMetadata = TActualOrder & { print: string };
