import { TOrder } from '../data/order.type';
import { EStock } from '../data/bot.model';

export class TraderExecutor {
    constructor(private readonly stock: EStock, private readonly apiKey: string) {}

    async getUpOrder(): Promise<TOrder> {
        // TODO -
        return;
    }

    async getDownOrder(): Promise<TOrder> {
        // TODO -
        return;
    }

    async updateOrder(order: TOrder): Promise<void> {
        // TODO -
    }

    async placeOrder(order: TOrder): Promise<void> {
        // TODO -
    }

    async cancelOrder(order: TOrder): Promise<void> {
        // TODO -
    }

    async cancelAllOrders(): Promise<void> {
        // TODO -
    }

    async hasPosition(): Promise<boolean> {
        // TODO -
        return;
    }

    async isUpPosition(): Promise<boolean> {
        // TODO -
        return;
    }

    async closePosition(): Promise<void> {
        // TODO -
    }

    async getBalance(): Promise<number> {
        // TODO -
        return;
    }
}
