import { TOrder } from '../data/order.type';
import { EStock } from '../data/bot.model';

export class TraderExecutor {
    constructor(private readonly stock: EStock, private readonly apiKey: string) {}

    async getOrders(): Promise<Array<TOrder>> {
        // TODO -
        return [];
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

    async hasNotPosition(): Promise<boolean> {
        return !(await this.hasPosition());
    }

    async hasOrders(): Promise<boolean> {
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
