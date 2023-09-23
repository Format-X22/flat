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
import { ContentModule } from './content/content.module';
import { PostModel } from './content/content.model';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'postgres',
            database: 'local',
            entities: [PostModel],
            synchronize: true,
        }),
        PublicModule,
        StatusModule,
        ContentModule,
    ],
    controllers: [],
    providers: [],
})
export class SiteModule {}
