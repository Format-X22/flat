import { Injectable, Logger } from '@nestjs/common';
import { BotModel } from '../data/bot.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TraderService {
    private readonly logger: Logger = new Logger(TraderService.name);

    constructor(@InjectRepository(BotModel) private botRepo: Repository<BotModel>) {}

    // Нужно создавать цепочки вызовов т.к. боты должны быть не зависимы в плане исполнения для них ордеров
    // Надо стейт-машину модели бота и обрабатывать её
    // Надо сначала всё отменять (при этом если там вдруг позиция - её крыть и останавливаться - ошибка)
    // После выставлять свеже полученные ордера
    // Также надо иметь возможность заслать полную отмену следующей сделки, будто она есть, но не исполнять
    // Отмену эту также можно сделать на существующие ордера в моменте, но если нет позиции
    // Также надо сделать ручник для отмены всех ордеров
    // И ручник для выхода из всех позиций
    // И также должна быть ручка, которая перед выключением бота всё погасит

    async handleNewDetections(): Promise<void> {
        const bots = await this.botRepo.find({ where: { isActive: true } });

        for (const bot of bots) {
            this.handleDetectionFor(bot).catch((error) =>
                this.logger.error(`FATAL on handle new detectiosn for bot ${bot.id} - ${error}`),
            );
        }
    }

    async handleOrderCollisions(): Promise<void> {
        const bots = await this.botRepo.find({ where: { isActive: true } });

        for (const bot of bots) {
            this.handleOrderCollisionsFor(bot).catch((error) =>
                this.logger.error(`FATAL on handle new detectiosn for bot ${bot.id} - ${error}`),
            );
        }
    }

    async deactivate(bot: BotModel): Promise<void> {
        // TODO -
    }

    async cancelNextDetection(): Promise<void> {
        // TODO -
    }

    private async handleDetectionFor(bot: BotModel): Promise<void> {
        // TODO -
    }

    private async handleOrderCollisionsFor(bot: BotModel): Promise<void> {
        // TODO -
    }

    private async getOrders(bot: BotModel): Promise<void> {
        // TODO -
    }
}
