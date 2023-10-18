import { Ctx, Hears, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';

// TODO Auth middleware
@Update()
export class AdminScenario {
    @Hears(/help/i)
    async printHelp(@Ctx() ctx: Context): Promise<void> {
        await ctx.reply('TODO');
    }

    @Hears(/status/i)
    async printStatus(@Ctx() ctx: Context): Promise<void> {
        await ctx.reply('TODO');
    }

    @Hears(/start/i)
    async startBot(@Ctx() ctx: Context): Promise<void> {
        await ctx.reply('TODO');
    }

    @Hears(/stop/i)
    async stopBot(@Ctx() ctx: Context): Promise<void> {
        await ctx.reply('TODO');
    }

    @Hears(/add/i)
    async addBot(@Ctx() ctx: Context): Promise<void> {
        await ctx.reply('TODO');
    }

    @Hears(/edit/i)
    async editBot(@Ctx() ctx: Context): Promise<void> {
        await ctx.reply('TODO');
    }

    @Hears(/delete/i)
    async deleteBot(@Ctx() ctx: Context): Promise<void> {
        await ctx.reply('TODO');
    }

    @Hears(/bots/i)
    async printBotList(@Ctx() ctx: Context): Promise<void> {
        await ctx.reply('TODO');
    }

    @Hears(/bot/i)
    async printBot(@Ctx() ctx: Context): Promise<void> {
        await ctx.reply('TODO');
    }
}
