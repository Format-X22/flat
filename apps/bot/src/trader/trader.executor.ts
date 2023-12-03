import { EDirection, TOrder, TPosition } from '../data/order.type';
import { EStock } from '../data/bot.model';
import * as ccxt from 'ccxt';

// TODO Call with retry
// TODO Dechipher keys

export class TraderExecutor {
    readonly api: ccxt.bybit | ccxt.binance;

    constructor(stock: EStock, publicKey: string, privateKey: string) {
        switch (stock) {
            case EStock.BYBIT:
                this.api = new ccxt.bybit({
                    apiKey: publicKey,
                    secret: privateKey,
                });
                break;
            case EStock.BINANCE:
                this.api = new ccxt.binanceusdm({
                    apiKey: publicKey,
                    secret: privateKey,
                });
        }
    }

    async hasUpOrder(order: TOrder): Promise<boolean> {
        const rawOrders = await this.api.fetchOrders('BTCUSDT');
        const upOrders = rawOrders.filter((raw) => raw.side === 'buy' && raw['triggerPrice'] === order.enter);

        return upOrders.length > 0;
    }

    async hasDownOrder(order: TOrder): Promise<boolean> {
        const rawOrders = await this.api.fetchOrders('BTCUSDT');
        const downOrders = rawOrders.filter((raw) => raw.side === 'sell' && raw['triggerPrice'] === order.enter);

        return downOrders.length > 0;
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

    async getPosition(): Promise<TPosition> {
        const position = await this.api.fetchPosition('BTCUSDT');

        if (!position.contracts) {
            return null;
        }

        return {
            direction: position.side === 'long' ? EDirection.UP : EDirection.DOWN,
        };
    }

    async closePosition(): Promise<void> {
        // TODO -
    }

    async getBalance(): Promise<number> {
        const balances = await this.api.fetchBalance();

        return balances.total['USDT'];
    }
}
