import { Module } from '@nestjs/common';
import { LoaderModule } from './loader/loader.module';
import { CalculatorModule } from './calculator/calculator.module';
import { DetectorModule } from './detector/detector.module';
import { SegmentModule } from './segment/segment.module';

@Module({
    imports: [LoaderModule, CalculatorModule, DetectorModule, SegmentModule],
    exports: [CalculatorModule, LoaderModule],
})
export class AnalyzerModule {}
