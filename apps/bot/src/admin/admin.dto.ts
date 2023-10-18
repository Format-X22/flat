import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { EPair, EStock } from '../data/bot.model';
import { Context } from 'telegraf';
import { Message, Update } from 'telegraf/types';

export type TContext = Context<Update.MessageUpdate<Message.TextMessage>>;

export class GetBotListArgs {
    @IsOptional()
    @IsBoolean()
    isActive?: boolean | null;
}

export class AddBotArgs {
    @IsBoolean()
    isActive: boolean;

    @IsString()
    @IsEnum(EStock)
    stock: EStock;

    @IsString()
    @IsEnum(EPair)
    pair: EPair;

    @IsString()
    apiKey: string;

    @IsString()
    owner?: string;
}

export class EditBotArgs {
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    @IsEnum(EStock)
    stock?: EStock;

    @IsOptional()
    @IsString()
    @IsEnum(EPair)
    pair?: EPair;

    @IsOptional()
    @IsString()
    apiKey?: string;

    @IsOptional()
    @IsString()
    owner?: string;
}
