import { Injectable, Logger } from '@nestjs/common';
import { BotModel } from '../data/bot.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TraderStater } from './trader.stater';
import { TraderExecutor } from './trader.executor';
import { BotLogModel } from '../data/bot-log.model';

@Injectable()
export class TraderService {
    private readonly logger: Logger = new Logger(TraderService.name);

    constructor(
        @InjectRepository(BotModel) private botRepo: Repository<BotModel>,
        @InjectRepository(BotLogModel) private botLogRepo: Repository<BotLogModel>,
    ) {}

    // TODO -
    // Надо проверить что при виртуальном входе в позицию ордера зачищаются, либо не возвращаются при калке
    // Надо бы в статус по ботам выводить ещё ордера и позиции
    // Нужно логгировать изменения балансов на счетах ботов

    async start(): Promise<void> {
        const bots = await this.botRepo.find();

        for (const bot of bots) {
            const stater = new TraderStater(
                bot,
                this.botRepo,
                this.botLogRepo,
                new TraderExecutor(bot.stock, bot.apiKey),
            );

            stater.run().catch((error) => {
                this.logger.error(`Fatal on run stater, invalid code? - ${error}`);
            });
        }
    }
}
