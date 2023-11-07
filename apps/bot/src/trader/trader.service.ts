import { Injectable, Logger } from '@nestjs/common';
import { BotModel } from '../data/bot.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TraderIterator } from './trader.iterator';
import { TraderExecutor } from './trader.executor';
import { BotLogModel } from '../data/bot-log.model';
import { CalculatorService } from '../analyzer/calculator/calculator.service';

@Injectable()
export class TraderService {
    private readonly logger: Logger = new Logger(TraderService.name);

    constructor(
        @InjectRepository(BotModel) private readonly botRepo: Repository<BotModel>,
        @InjectRepository(BotLogModel) private readonly botLogRepo: Repository<BotLogModel>,
        private readonly calculatorService: CalculatorService,
    ) {}

    // TODO -
    // Надо бы в статус по ботам выводить ещё ордера и позиции

    async start(): Promise<void> {
        const bots = await this.botRepo.find();

        for (const bot of bots) {
            const stater = new TraderIterator(
                bot,
                this.botRepo,
                this.botLogRepo,
                new TraderExecutor(bot.stock, bot.apiKey),
                this.calculatorService,
            );

            stater.run().catch((error) => {
                this.logger.error(`Fatal on run stater, invalid code? - ${error}`);
            });
        }
    }
}
