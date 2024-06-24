import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as process from 'process';
import { AnalyzerService } from '../analyzer/analyzer.service';
import { TraderService } from '../trader/trader.service';
import { config } from '../bot.config';
import { LoaderService } from '../loader/loader.service';
import { seconds } from '../utils/time.util';
import { TelegramService, TTextContext } from '../telegram/telegram.service';

@Injectable()
export class ControlService implements OnApplicationBootstrap {
    constructor(
        private readonly configService: ConfigService,
        private readonly loaderService: LoaderService,
        private readonly analyserService: AnalyzerService,
        private readonly traderService: TraderService,
        private readonly telegramService: TelegramService,
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        if (config.botMode) {
            await this.initBotControl();
        }
    }

    private async initBotControl(): Promise<void> {
        const tg = this.telegramService;

        tg.use((ctx, next) => this.onlyForAdmin(ctx, next));
        tg.onCommand('help', (ctx) => this.printHelp(ctx));
        tg.onText('help', (ctx) => this.printHelp(ctx));
        tg.onText('calc', (ctx) => this.calc(ctx));
        tg.onText(/^start/, (ctx) => this.start(ctx));
        tg.onText('stop', (ctx) => this.stop(ctx));
        tg.onText('emergency', (ctx) => this.emergency(ctx));
        tg.onText(/.*/, (ctx) => this.unknownMessage(ctx));

        tg.launch(() => tg.sendToAdmin('Started!'));
    }

    private async onlyForAdmin(ctx: TTextContext, next: () => Promise<void>): Promise<void> {
        if (this.telegramService.isAdmin(ctx)) {
            await next();
        }
    }

    private async unknownMessage(ctx: TTextContext): Promise<void> {
        await ctx.reply('Unknown command');
        await this.printHelp(ctx);
    }

    private async printHelp(ctx: TTextContext): Promise<void> {
        await ctx.reply(
            [
                'help - Print this message',
                'emergency - Hard stop',
                'calc - Load fresh data and analyze',
                'start [capital] - Start trader with capital',
                'stop - Stop trader',
            ].join('\n'),
        );
    }

    private async emergency(ctx: TTextContext): Promise<void> {
        await ctx.reply('Ok, hard stop on 5 seconds...');
        setTimeout(() => process.exit(0), seconds(5));
    }

    private async calc(ctx: TTextContext): Promise<void> {
        const cfgPrintTrades = config.printTrades;

        config.printTrades = false;

        try {
            await ctx.reply('Load data...');
            await this.loaderService.loadActual();
            await ctx.reply('Data loaded! Analyze...');

            const { print } = await this.analyserService.calc({
                risk: config.risk,
                from: config.from,
                to: config.to,
            });
            await ctx.reply(print);
        } catch (error) {
            await ctx.reply(String(error));
        } finally {
            config.printTrades = cfgPrintTrades;
        }
    }

    private async start(ctx: TTextContext): Promise<void> {
        try {
            const capital = Number(ctx.message.text.split(' ')[1]);

            if (!Number.isFinite(capital) || capital <= 0) {
                await ctx.reply('Invalid number');
                return;
            }

            await this.traderService.start(capital);
            await ctx.reply('Started! Capital ' + capital);
        } catch (error) {
            await ctx.reply(String(error));
        }
    }

    private async stop(ctx: TTextContext): Promise<void> {
        try {
            await this.traderService.stop();
            await ctx.reply('Stopped!');
        } catch (error) {
            await ctx.reply(String(error));
        }
    }
}
