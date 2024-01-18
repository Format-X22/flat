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
            useFactory: async (configService: ConfigService) => ({
                type: 'sqlite',
                database: 'base.db',
                key: configService.get('F_DB_KEY'),
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
