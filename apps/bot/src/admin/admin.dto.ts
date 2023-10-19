import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { EPair, EStock } from '../data/bot.model';
import { Context } from 'telegraf';
import { Message, Update } from 'telegraf/types';
import { ELogType } from '../data/bot-log.model';

export type TContext = Context<Update.MessageUpdate<Message.TextMessage>>;

export class GetLogsArgs {
    @IsString()
    @IsEnum(ELogType)
    type: ELogType;

    @IsNumber()
    @Min(0)
    @Max(1000)
    limit: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(Number.MAX_SAFE_INTEGER)
    skip: number;
}

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
    owner: string;
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
