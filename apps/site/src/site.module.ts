import { Module } from '@nestjs/common';
import { LoaderModule } from '../../bot/src/loader/loader.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandleModel } from '../../bot/src/loader/candle.model';
import { CalculatorModule } from '../../bot/src/calculator/calculator.module';
import { DetectorModule } from '../../bot/src/detector/detector.module';
import { SegmentModule } from '../../bot/src/segment/segment.module';
import { ConfigModule } from '@nestjs/config';
import { PublicModule } from './public/public.module';
import { StatusModule } from './status/status.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PublicModule,
        StatusModule,
    ],
    controllers: [],
    providers: [],
})
export class SiteModule {}
