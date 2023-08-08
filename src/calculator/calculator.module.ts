import { Module } from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandleModel } from '../loader/candle.model';

@Module({
    imports: [TypeOrmModule.forFeature([CandleModel])],
    providers: [CalculatorService],
})
export class CalculatorModule {}
