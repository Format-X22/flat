import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Context, Telegraf } from 'telegraf';
import * as process from 'process';
import { Message } from '@telegraf/types';

export type TTextContext = Context & { message: Message.TextMessage };

@Injectable()
export class TelegramService {
    private readonly bot: Telegraf;
    private readonly admin: number;

    constructor(private readonly configService: ConfigService) {
        this.admin = Number(this.configService.get('F_TG_ADMIN'));
        this.bot = new Telegraf(this.configService.get('F_TG_KEY'));
    }

    isAdmin(ctx: TTextContext): boolean {
        return ctx.from.id === this.admin;
    }

    use(handler: (ctx: TTextContext, next: () => Promise<void>) => void): void {
        this.bot.use(handler);
    }

    onCommand(message: string, handler: (ctx: TTextContext) => Promise<void>): void {
        this.bot.command(message, handler);
    }

    onText(message: string | RegExp, handler: (ctx: TTextContext) => Promise<void>): void {
        this.bot.hears(message, handler);
    }

    async sendToAdmin(message: string): Promise<void> {
        await this.bot.telegram.sendMessage(this.admin, message);
    }

    launch(onLaunch: () => Promise<void>): void {
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));

        this.bot.launch(onLaunch).catch((error) => {
            throw error;
        });
    }
}
