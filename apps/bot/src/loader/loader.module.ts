import { Module } from '@nestjs/common';
import { LoaderService } from './loader.service';
import { CandleModel } from '../data/candle.model';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { BinanceLoader } from './source/binance';

@Module({
    imports: [TypeOrmModule.forFeature([CandleModel]), HttpModule],
    providers: [BinanceLoader, LoaderService],
    exports: [LoaderService],
})
export class LoaderModule {}
