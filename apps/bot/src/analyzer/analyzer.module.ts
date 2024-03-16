import { Module } from '@nestjs/common';
import { AnalyzerService } from './analyzer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandleModel } from '../data/candle.model';

@Module({
    imports: [TypeOrmModule.forFeature([CandleModel])],
    providers: [AnalyzerService],
})
export class AnalyzerModule {}
