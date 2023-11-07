import { Ctx, Hears, Update } from 'nestjs-telegraf';
import { AddBotArgs, EditBotArgs, GetLogsArgs, TContext } from './admin.dto';
import { AdminService } from './admin.service';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateOrReject, ValidationError } from 'class-validator';
import { EPair, EStock } from '../data/bot.model';
import { ELogType } from '../data/bot-log.model';

@Update()
export class AdminScenario {
    private readonly admin: number;

    constructor(private adminService: AdminService, configService: ConfigService) {
        this.admin = Number(configService.get('F_TG_ADMIN'));
    }

    @Hears(/^help/i)
    async printHelp(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(
            ctx,
            async () => {
                await ctx.reply(
                    [
                        'Commands:',
                        '',
                        '>> bot [id] - get bot data',
                        '',
                        '>> bots - get active bots data',
                        '>> bots all - get all bots data',
                        '',
                        '>> logs [ALL | VERBOSE | ERROR | TRADE]',
                        '[limit] [skip] - print typed logs',
                        '',
                        '>> start [id] - start bot by id',
                        '>> bot [id] start',
                        '',
                        '>> stop [id] - stop bot by id',
                        '>> bot [id] stop',
                        '',
                        '>> add - add new bot',
                        '>> bot add',
                        'isActive: boolean',
                        'stock: BINANCE | BYBIT',
                        'pair: BTCUSDT',
                        'apiKey: string',
                        'owner: string',
                        'risk: number (percent like 40)',
                        '',
                        '>> edit [id] - edit bot',
                        '>> bot [id] edit',
                        'isActive?: boolean',
                        'stock?: BINANCE | BYBIT',
                        'pair?: BTCUSDT',
                        'apiKey?: string',
                        'owner?: string',
                        'risk?: number (percent like 40)',
                    ].join('\n'),
                    {
                        reply_markup: {
                            keyboard: [['help'], ['bots'], ['logs']],
                            resize_keyboard: true,
                        },
                    },
                );
            },
            true,
        );
    }

    @Hears(/^logs/)
    async printLogs(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            const raw = this.getRawCommandInline(ctx);
            const data: GetLogsArgs = {
                type: (raw[1]?.toUpperCase() as ELogType) || ELogType.ALL,
                limit: Number(raw[2]) || 100,
                skip: Number(raw[3]) || 0,
            };

            await validateOrReject(plainToInstance(GetLogsArgs, data));

            return await this.adminService.getLogs(data);
        });
    }

    @Hears([/^start/i, /^bot .+ start/i])
    async startBot(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            await this.adminService.startBot(this.getId(ctx));
        });
    }

    @Hears([/^start/i, /^bot .+ stop/i])
    async stopBot(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            await this.adminService.stopBot(this.getId(ctx));
        });
    }

    @Hears([/^add/i, /^bot add/i])
    async addBot(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            const raw = this.getRawCommand(ctx);
            const data: AddBotArgs = {
                isActive: JSON.parse(raw[1]),
                stock: raw[2] as EStock,
                pair: raw[3] as EPair,
                apiKey: raw[4],
                owner: raw[5],
                risk: parseInt(raw[6]),
            };

            await validateOrReject(plainToInstance(AddBotArgs, data));

            return await this.adminService.addBot(data);
        });
    }

    @Hears([/^edit/i, /^bot .+ edit/])
    async editBot(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            const raw = this.getRawCommand(ctx);
            const id = this.getId(ctx);
            const data: EditBotArgs = {
                isActive: JSON.parse(raw[1]),
                stock: raw[2] as EStock,
                pair: raw[3] as EPair,
                apiKey: raw[4],
                owner: raw[5],
                risk: parseInt(raw[6]),
            };

            await validateOrReject(plainToInstance(AddBotArgs, data));

            return await this.adminService.editBot(id, data);
        });
    }

    @Hears(/^bots all/i)
    async printAllBotList(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            return this.adminService.getBots({ isActive: false });
        });
    }

    @Hears(/^bots/i)
    async printBotList(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            return this.adminService.getBots({ isActive: true });
        });
    }

    @Hears(/^bot/i)
    async printBot(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            return await this.adminService.getBot(this.getId(ctx));
        });
    }

    private getRawCommand(ctx: TContext): Array<string> {
        return ctx.message.text.split('\n').map((i) => i.trim());
    }

    private getRawCommandInline(ctx: TContext): Array<string> {
        return ctx.message.text.split(' ').map((i) => i.trim());
    }

    private getId(ctx: TContext): number {
        const raw = this.getRawCommandInline(ctx);
        const id = Number(raw[1]);

        if (isNaN(id)) {
            throw new Error('Invalid bot id');
        }

        return id;
    }

    private async replyJSON(ctx: TContext, data: Record<string, any> | string): Promise<void> {
        await ctx.reply(JSON.stringify(data, null, 2));
    }

    private async handle(
        ctx: TContext,
        fn: () => Promise<void | string | number | Record<string, any>>,
        silent = false,
    ): Promise<void> {
        if (ctx.from.id !== this.admin) {
            await ctx.reply('error');
            return;
        }

        try {
            const result = await fn();

            if (result === null) {
                await ctx.reply('Not found');
            } else if (typeof result === 'undefined') {
                if (!silent) {
                    await ctx.reply('OK');
                }
            } else if (typeof result === 'string') {
                await ctx.reply(result);
            } else if (typeof result === 'number') {
                await ctx.reply(String(result));
            } else {
                await this.replyJSON(ctx, result);
            }
        } catch (error) {
            if (Array.isArray(error) && error[0] instanceof ValidationError) {
                await this.replyJSON(
                    ctx,
                    error.map((item: ValidationError) => ({
                        [item.property]: item.constraints,
                    })),
                );
            } else {
                await ctx.reply(error.message || String(error) || 'Empty error');
            }
        }
    }
}
