import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { BotModel } from '../data/bot.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TraderStater } from './trader.stater';
import { TraderExecutor } from './trader.executor';

@Injectable()
export class TraderService implements OnApplicationBootstrap {
    private readonly logger: Logger = new Logger(TraderService.name);

    constructor(@InjectRepository(BotModel) private botRepo: Repository<BotModel>) {}

    // Нужно создавать цепочки вызовов т.к. боты должны быть не зависимы в плане исполнения для них ордеров
    // Также надо сделать ручник для отмены всех ордеров
    // И ручник для выхода из всех позиций

    // Надо проверить что при виртуальном входе в позицию ордера зачищаются, либо не возвращаются при калке
    // Надо бы в статус по ботам выводить ещё ордера и позиции

    async onApplicationBootstrap(): Promise<void> {
        const bots = await this.botRepo.find();

        for (const bot of bots) {
            const stater = new TraderStater(bot, this.botRepo, new TraderExecutor(bot.stock, bot.apiKey));

            stater.run().catch((error) => {
                this.logger.error(`Fatal on run stater, invalid code? - ${error}`);
            });
        }
    }
}
