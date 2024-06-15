import { Module } from '@nestjs/common';
import { LoaderService } from './loader.service';
import { CandleModel } from '../data/candle.model';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [TypeOrmModule.forFeature([CandleModel]), HttpModule],
    providers: [LoaderService],
    exports: [LoaderService],
})
export class LoaderModule {}
