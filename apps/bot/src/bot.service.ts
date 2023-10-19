import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { TraderService } from './trader/trader.service';
import * as process from 'process';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotService implements OnApplicationBootstrap {
    private readonly logger: Logger = new Logger(BotService.name);

    constructor(
        private configService: ConfigService,
        private tradeService: TraderService,
        @InjectBot() private bot: Telegraf<Context>,
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        const admin = Number(this.configService.get('F_TG_ADMIN'));

        await this.bot.telegram.sendMessage(admin, 'Started!');
        this.tradeService.start().catch((error) => {
            this.logger.error(error);
            process.exit(1);
        });
    }
}
