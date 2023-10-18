import { Ctx, Hears, Update } from 'nestjs-telegraf';
import { TContext } from './admin.dto';
import { AdminService } from './admin.service';

@Update()
export class AdminScenario {
    constructor(private adminService: AdminService) {}

    @Hears(/help/i)
    async printHelp(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(
            ctx,
            async () => {
                await ctx.reply(
                    [
                        'Commands:',
                        '',
                        '>> status - print status',
                        '',
                        '>> bot [id] - get bot data',
                        '',
                        '>> bots - get all bots data',
                        'isActive: boolean',
                        '',
                        '>> start [id] - start bot by id',
                        '',
                        '>> stop [id] - stop bot by id',
                        '',
                        '>> add - add new bot',
                        'isActive: boolean',
                        'stock: BINANCE | BYBIT',
                        'pair: BTCUSDT',
                        'apiKey: string',
                        'owner: string',
                        '',
                        '>> edit - edit bot',
                        'isActive?: boolean',
                        'stock?: BINANCE | BYBIT',
                        'pair?: BTCUSDT',
                        'apiKey?: string',
                        'owner?: string',
                    ].join('\n'),
                    { reply_markup: { keyboard: [['help'], ['status']] } },
                );
            },
            true,
        );
    }

    @Hears(/status/i)
    async printStatus(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            return 'TODO';
        });
    }

    @Hears(/start/i)
    async startBot(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            await this.adminService.startBot(this.getId(ctx));
        });
    }

    @Hears(/stop/i)
    async stopBot(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            await this.adminService.stopBot(this.getId(ctx));
        });
    }

    @Hears(/add/i)
    async addBot(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            return 'TODO';
        });
    }

    @Hears(/edit/i)
    async editBot(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            return 'TODO';
        });
    }

    @Hears(/bots/i)
    async printBotList(@Ctx() ctx: TContext): Promise<void> {
        await this.handle(ctx, async () => {
            return 'TODO';
        });
    }

    @Hears(/bot/i)
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
        fn: () => Promise<void | string | Record<string, any>>,
        silent = false,
    ): Promise<void> {
        // TODO Auth middleware

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
            } else {
                await this.replyJSON(ctx, result);
            }
        } catch (error) {
            await ctx.reply(error.message);
        }
    }
}
