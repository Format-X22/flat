import { Module } from '@nestjs/common';
import { LoaderService } from './loader.service';
import { CandleModel } from '../data/candle.model';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { BinanceLoader } from './source/binance';
import { PolygonLoader } from './source/polygon';

@Module({
    imports: [TypeOrmModule.forFeature([CandleModel]), HttpModule],
    providers: [BinanceLoader, PolygonLoader, LoaderService],
    exports: [LoaderService],
})
export class LoaderModule {}
