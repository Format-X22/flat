import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { EPair, EStock } from '../data/bot.model';

export class RegisterPayArgs {
    @ApiProperty()
    @IsNumber()
    amount: number;
}

export class GetBotListArgs {
    @ApiPropertyOptional({ nullable: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean | null;
}

export class AddBotArgs {
    @ApiProperty()
    @IsBoolean()
    isActive: boolean;

    @ApiProperty({ enum: EStock })
    @IsString()
    @IsEnum(EStock)
    stock: EStock;

    @ApiProperty({ enum: EPair })
    @IsString()
    @IsEnum(EPair)
    pair: EPair;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    @Max(33)
    coldPercent: number;

    @ApiProperty()
    @IsString()
    apiKey: string;
}

export class EditBotArgs {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ enum: EStock })
    @IsOptional()
    @IsString()
    @IsEnum(EStock)
    stock?: EStock;

    @ApiPropertyOptional({ enum: EPair })
    @IsOptional()
    @IsString()
    @IsEnum(EPair)
    pair?: EPair;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(33)
    coldPercent?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    apiKey?: string;
}
