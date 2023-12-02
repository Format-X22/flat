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

    readonly iterators: Array<TraderIterator> = [];

    constructor(
        @InjectRepository(BotModel) private readonly botRepo: Repository<BotModel>,
        @InjectRepository(BotLogModel) private readonly botLogRepo: Repository<BotLogModel>,
        private readonly calculatorService: CalculatorService,
    ) {}

    async start(): Promise<void> {
        const bots = await this.botRepo.find();

        for (const bot of bots) {
            const iterator = new TraderIterator(
                bot,
                this.botRepo,
                this.botLogRepo,
                new TraderExecutor(bot.stock, bot.apiKey),
                this.calculatorService,
            );

            this.iterators.push(iterator);

            iterator.run().catch((error) => {
                this.logger.error(`Fatal on run iterator, invalid code? - ${error}`);
            });
        }
    }
}
