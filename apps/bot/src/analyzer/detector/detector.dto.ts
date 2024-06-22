export type TOrder = {
    isActive: boolean;
    enter: number;
    take: number;
    stop: number;
    enterDate: string;
    waitDays: number;
};

export type TActualOrder = {
    up: TOrder;
    down: TOrder;
};

export type TActualOrderWithMetadata = TActualOrder & { print: string };
