import { Module } from '@nestjs/common';
import { DetectorService } from './detector.service';
import { SegmentModule } from '../segment/segment.module';

@Module({
    imports: [SegmentModule],
    providers: [DetectorService],
    exports: [DetectorService],
})
export class DetectorModule {}
