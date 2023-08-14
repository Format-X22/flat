import { Module } from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandleModel } from '../loader/candle.model';
import { TradeModule } from '../trade/trade.module';
import { SegmentModule } from '../segment/segment.module';

@Module({
    imports: [TypeOrmModule.forFeature([CandleModel]), TradeModule, SegmentModule],
    providers: [CalculatorService],
})
export class CalculatorModule {}
