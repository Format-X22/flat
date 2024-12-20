import { Injectable, Logger } from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoaderService } from '../loader/loader.service';
import { AnalyzerService } from '../analyzer/analyzer.service';
import { config } from '../bot.config';
import { ESide, TActualOrder, TOrder } from '../analyzer/detector/detector.dto';
import { TCurrentStockOrders, TStockOrder } from './trader.dto';
import { bybit as Bybit } from 'ccxt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TraderService {
    private readonly logger: Logger = new Logger(TraderService.name);
    private capital: number;
    private started: boolean;

    // TODO Refactor this
    private readonly bybit: Bybit;

    constructor(
        private readonly telegramService: TelegramService,
        private readonly loaderService: LoaderService,
        private readonly analyserService: AnalyzerService,
        configService: ConfigService,
    ) {
        // TODO Refactor this
        /*this.bybit = new Bybit({
            apiKey: configService.get('F_BYBIT_PUBLIC_KEY'),
            secret: configService.get('F_BYBIT_PRIVATE_KEY'),
        });*/
    }

    async start(capital: number): Promise<void> {
        if (this.started) {
            throw 'Already started!';
        }

        this.started = true;
        this.capital = capital;

        this.logger.log('Trader started!');

        this.handleDay().catch();
    }

    async stop(): Promise<void> {
        if (!this.started) {
            throw 'Already stopped.';
        }

        this.started = false;
        this.capital = null;

        this.logger.log('Trader stopped.');
    }

    // TODO Refactor this
    //@Cron(CronExpression.EVERY_DAY_AT_9AM, { timeZone: 'UTC' })
    private async handleDay(): Promise<void> {
        if (!config.botMode) {
            return;
        }

        if (!this.started) {
            await this.notify('Not started today.');
            return;
        }

        try {
            await this.loaderService.loadActual();
            await this.notify('New data loaded!');

            if (!this.started) {
                await this.notify('Ok, cancel.');
                return;
            }

            const { up, down, print } = await this.analyserService.calc({
                risk: config.risk,
                from: config.from,
                to: config.to,
            });
            await this.notify(print);

            if (!this.started) {
                await this.notify('Ok, cancel.');
                return;
            }

            await this.handleAnalysis({ up, down });
            await this.notify('Task is done! See you tomorrow.');
        } catch (error) {
            const message = 'Fail on handle day! ' + String(error);

            this.logger.error(message);
            await this.notify(message);
        }
    }

    private async handleAnalysis(newOrders: TActualOrder): Promise<void> {
        const position = await this.getPosition();

        if (position) {
            await this.handlePosition(position, newOrders);
        } else {
            await this.updateOrders(newOrders);
        }
    }

    private async handlePosition(position: TStockOrder, { up: newUp, down: newDown }: TActualOrder): Promise<void> {
        let targetOrder;

        if (position.enter > position.stop) {
            targetOrder = newUp;
        } else {
            targetOrder = newDown;
        }

        if (this.isOrdersEqual(targetOrder, position)) {
            await this.notify('Position not changed, do nothing.');
            return;
        }

        await this.updatePosition(position, targetOrder);
        await this.notify('Position updated.');
    }

    private async updateOrders({ up: newUp, down: newDown }: TActualOrder): Promise<void> {
        const { up: currentUp, down: currentDown } = await this.getCurrentOrders();

        if (!newUp && !currentUp && !newDown && !currentDown) {
            await this.notify('No new orders, no old orders, skip this day.');
            return;
        }

        if (this.isOrdersEqual(newUp, currentUp) && this.isOrdersEqual(newDown, currentDown)) {
            await this.notify('All orders equals, do nothing.');
            return;
        }

        await this.handleChanges(newUp, currentUp, ESide.UP);
        await this.handleChanges(newDown, currentDown, ESide.DOWN);
    }

    private async handleChanges(newOrder: TOrder, currentOrder: TStockOrder, side: ESide): Promise<void> {
        if (this.isOrdersEqual(newOrder, currentOrder)) {
            await this.notify(`${side} order not changed, skip.`);
        } else {
            if (newOrder && currentOrder) {
                await this.updateOrder(newOrder, currentOrder);
                await this.notify(`${side} order updated.`);
            } else if (newOrder && !currentOrder) {
                await this.placeOrder(newOrder);
                await this.notify(`${side} order placed.`);
            } else {
                await this.cancelOrder(currentOrder);
                await this.notify(`${side} order cancelled.`);
            }
        }
    }

    private isOrdersEqual(a: TOrder, b: TStockOrder): boolean {
        return a?.stop == b?.stop && a?.take == b?.take && a?.enter == b?.enter;
    }

    private async notify(message: string): Promise<void> {
        await this.telegramService.sendToAdmin(message);
    }

    private async getPosition(): Promise<TStockOrder> {
        // TODO -
        return;
    }

    private async getCurrentOrders(): Promise<TCurrentStockOrders> {
        // TODO -
        return { up: null, down: null };
    }

    private async placeOrder(newOrder: TOrder): Promise<void> {
        // TODO Refactor this
        const symbol = 'BTCUSDT';
        const type = 'limit';
        const side = newOrder.take > newOrder.enter ? 'buy' : 'sell';
        const price = Number((side === 'buy' ? newOrder.enter * 1.0015 : newOrder.enter / 1.0015).toFixed(0));
        const trigger = Number(newOrder.enter.toFixed(0));
        const take = Number(newOrder.take.toFixed(0));
        const stop = Number(newOrder.stop.toFixed(0));
        const triggerDirection = side === 'buy' ? 1 : 2;

        const mulOffset =
            (side === 'buy'
                ? 100 - (newOrder.stop * 100) / newOrder.enter
                : (newOrder.stop * 100) / newOrder.enter - 100) + 0.25;
        const priceCapital = (33 / mulOffset) * this.capital;
        const amount = Number((Math.ceil((priceCapital / newOrder.enter) * 1000) / 1000).toFixed(3));

        await this.bybit.createTriggerOrder(symbol, type, side, amount, price, trigger, {
            triggerBy: 'IndexPrice',
            takeProfit: take,
            tpTriggerBy: 'LastPrice',
            stopLoss: stop,
            slTriggerBy: 'IndexPrice',
            triggerDirection,
            positionIdx: 0,
        });
    }

    private async updateOrder(newOrder: TOrder, currentOrder: TStockOrder): Promise<void> {
        // TODO -
    }

    private async cancelOrder(currentOrder: TStockOrder): Promise<void> {
        // TODO -
    }

    private async updatePosition(position: TStockOrder, newOrder: TOrder): Promise<void> {
        // TODO -
    }
}
