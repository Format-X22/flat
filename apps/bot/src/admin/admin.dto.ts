import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { EPair, EStock } from '../data/bot.model';

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

    @IsNumber()
    @Min(0)
    @Max(33)
    coldPercent: number;

    @IsString()
    apiKey: string;

    @IsOptional()
    @IsString()
    owner?: string;

    @IsOptional()
    @IsString()
    comment?: string;
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
    @IsNumber()
    @Min(0)
    @Max(33)
    coldPercent?: number;

    @IsOptional()
    @IsString()
    apiKey?: string;

    @IsOptional()
    @IsString()
    owner?: string;

    @IsOptional()
    @IsString()
    comment?: string;
}
