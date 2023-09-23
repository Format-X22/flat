import { IsBoolean, IsDate, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostListArgs {
    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(10_000)
    skip: number = 0;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 100;
}

export class PostArgs {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(256)
    title: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    text: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isHidden: boolean = false;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDate()
    date: Date;
}

export class PostDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    date: Date;

    @ApiProperty()
    title: string;

    @ApiProperty()
    text: string;

    @ApiProperty()
    isHidden: boolean;
}
