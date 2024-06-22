import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Context, Telegraf } from 'telegraf';
import { Message } from '@telegraf/types';
import * as process from 'process';
import { AnalyzerService } from '../analyzer/analyzer.service';
import { TraderService } from '../trader/trader.service';
import { config } from '../bot.config';
import { LoaderService } from '../loader/loader.service';
import { seconds } from '../utils/time.util';

type TTextContext = Context & { message: Message.TextMessage };

@Injectable()
export class ControlService implements OnApplicationBootstrap {
    constructor(
        private readonly configService: ConfigService,
        private readonly loaderService: LoaderService,
        private readonly analyserService: AnalyzerService,
        private readonly traderService: TraderService,
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        const apiKey = this.configService.get('F_TG_KEY');
        const admin = Number(this.configService.get('F_TG_ADMIN'));
        const bot = new Telegraf(apiKey);

        bot.use(async (ctx: Context, next: () => Promise<void>) => {
            if (ctx.from.id === admin) {
                await next();
            }
        });
        bot.command('help', this.printHelp.bind(this));
        bot.hears('help', this.printHelp.bind(this));
        bot.hears('calc', this.calc.bind(this));
        bot.hears(/^start/, this.start.bind(this));
        bot.hears('stop', this.stop.bind(this));
        bot.hears('emergency', this.emergency.bind(this));
        bot.hears(/.*/, async (ctx: Context) => {
            await ctx.reply('Unknown command');
            await this.printHelp(ctx);
        });
        await bot.launch(() => {
            bot.telegram.sendMessage(admin, 'Started!');
        });

        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
    }

    private async printHelp(ctx: Context): Promise<void> {
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

    private async emergency(ctx: Context): Promise<void> {
        await ctx.reply('Ok, hard stop on 5 seconds...');
        setTimeout(() => process.exit(0), seconds(5));
    }

    private async calc(ctx: Context): Promise<void> {
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

    private async stop(ctx: Context): Promise<void> {
        try {
            await this.traderService.stop();
            await ctx.reply('Stopped!');
        } catch (error) {
            await ctx.reply(String(error));
        }
    }
}
