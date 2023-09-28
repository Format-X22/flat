import { Module } from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandleModel } from '../../data/candle.model';
import { SegmentModule } from '../segment/segment.module';
import { DetectorModule } from '../detector/detector.module';

@Module({
    imports: [TypeOrmModule.forFeature([CandleModel]), DetectorModule, SegmentModule],
    providers: [CalculatorService],
    exports: [CalculatorService],
})
export class CalculatorModule {}
