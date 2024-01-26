import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandleModel } from './data/candle.model';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AnalyzerModule } from './analyzer/analyzer.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: async () => ({
                type: 'postgres',
                database: 'local',
                host: 'localhost',
                port: 5432,
                username: 'postgres',
                password: 'postgres',
                entities: [CandleModel],
                synchronize: true,
            }),
        }),
        AnalyzerModule,
    ],
    controllers: [],
    providers: [],
})
export class BotModule {}
