import { TOrder } from '../analyzer/detector/detector.dto';

export type TStockOrder = TOrder & {
    stockId: number | string;
};

export type TCurrentStockOrders = {
    up?: TStockOrder;
    down?: TStockOrder;
};
