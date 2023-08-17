import { Module } from '@nestjs/common';
import { LoaderModule } from './loader/loader.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandleModel } from './loader/candle.model';
import { CalculatorModule } from './calculator/calculator.module';
import { DetectorModule } from './detector/detector.module';
import { SegmentModule } from './segment/segment.module';

@Module({
    imports: [
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
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
