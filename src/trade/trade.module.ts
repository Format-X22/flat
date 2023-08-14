import { Module } from '@nestjs/common';
import { TradeService } from './trade.service';
import { SegmentModule } from '../segment/segment.module';
import { DetectorModule } from '../detector/detector.module';

@Module({
  imports: [SegmentModule, DetectorModule],
  providers: [TradeService],
  exports: [TradeService],
})
export class TradeModule {}
