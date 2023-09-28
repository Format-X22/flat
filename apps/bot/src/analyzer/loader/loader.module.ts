import { Module } from '@nestjs/common';
import { LoaderService } from './loader.service';
import { CandleModel } from '../../data/candle.model';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([CandleModel])],
    providers: [LoaderService],
    exports: [LoaderService],
})
export class LoaderModule {}
