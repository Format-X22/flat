import { Module } from '@nestjs/common';
import { StatusModule } from './status/status.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandleModel } from './loader/candle.model';
import { LoaderModule } from './loader/loader.module';
import { CalculatorModule } from './calculator/calculator.module';
import { DetectorModule } from './detector/detector.module';
import { SegmentModule } from './segment/segment.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        StatusModule,
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'postgres',
            database: 'local',
            entities: [CandleModel],
            synchronize: true,
        }),
        LoaderModule,
        CalculatorModule,
        DetectorModule,
        SegmentModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
    ],
    controllers: [],
    providers: [],
})
export class BotModule {}
