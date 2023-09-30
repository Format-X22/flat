import { Injectable, Logger } from '@nestjs/common';
import { BotModel } from '../data/bot.model';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { TOrder, TStockOrderId, TStockPositionId } from '../data/order.type';

@Injectable()
export class TraderService {
    private readonly logger: Logger = new Logger(TraderService.name);

    constructor(@InjectRepository(BotModel) private botRepo: Repository<BotModel>) {}

    // Нужно создавать цепочки вызовов т.к. боты должны быть не зависимы в плане исполнения для них ордеров
    // Надо стейт-машину модели бота и обрабатывать её
    // Надо сначала всё отменять (при этом если там вдруг позиция - её крыть и останавливаться - ошибка)
    // После выставлять свеже полученные ордера
    // Также надо сделать ручник для отмены всех ордеров
    // И ручник для выхода из всех позиций
    // И также должна быть ручка, которая перед выключением бота всё погасит

    // Надо бы проверять раз в 5 минут ещё и по деньгам чего там и прописывать в пей сколько мне должны по факту
    // Надо проверить что при виртуальном входе в позицию ордера зачищаются, либо не возвращаются при калке
    // Надо бы в статус по ботам выводить ещё ордера и позиции

    async handleNewDetections(): Promise<void> {
        await this.handleBots(true, this.handleDetectionFor.bind(this), 'new detections');
    }

    async handleOrderCollisions(): Promise<void> {
        await this.handleBots(true, this.handleOrderCollisionsFor.bind(this), 'order collision');
    }

    async handleBotDeactivates(): Promise<void> {
        await this.handleBots(false, this.handleDeactivateFor.bind(this), 'try deactivate');
    }

    async handleTakeAndPayAmount(): Promise<void> {
        await this.handleBots(true, this.handleTakeAndPayAmountFor.bind(this), 'take and pay amount');
    }

    async forceCloseAll(): Promise<void> {
        await this.handleBots(null, this.forceCloseAllFor.bind(this), 'force close all');
    }

    private async handleBots(
        isActive: boolean | null,
        fn: (bot: BotModel) => Promise<void>,
        errorTag: string,
    ): Promise<void> {
        let query: FindManyOptions<BotModel> = {};

        if (typeof isActive === 'boolean') {
            query = { where: { isActive } };
        }

        const bots: Array<BotModel> = await this.botRepo.find(query);

        for (const bot of bots) {
            fn(bot).catch((error) => this.logger.error(`FATAL on handle ${errorTag} for bot ${bot.id} - ${error}`));
        }
    }

    private async handleDetectionFor(bot: BotModel): Promise<void> {
        // TODO -
    }

    private async handleOrderCollisionsFor(bot: BotModel): Promise<void> {
        // TODO -
    }

    private async handleDeactivateFor(bot: BotModel): Promise<void> {
        // TODO -
    }

    private async handleTakeAndPayAmountFor(bot: BotModel): Promise<void> {
        // TODO -
    }

    private async forceCloseAllFor(bot: BotModel): Promise<void> {
        // TODO -
    }

    private async getOrders(bot: BotModel): Promise<void> {
        // TODO -
    }

    private async cancelAllOrders(bot: BotModel): Promise<void> {
        // TODO -
    }

    private async cancelOrder(bot: BotModel, orderId: TStockOrderId): Promise<void> {
        // TODO -
    }

    private async getPosition(bot: BotModel): Promise<void> {
        // TODO -
    }

    private async cancelPosition(bot: BotModel, positionId: TStockPositionId): Promise<void> {
        // TODO -
    }
}
