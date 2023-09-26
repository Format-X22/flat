export type TOrder = {
    isActive: boolean;
    enter: number;
    take: number;
    stop: number;
    enterDate: string;
    toZeroDate: number;
};

export type TActualOrder = {
    up: TOrder;
    down: TOrder;
};
