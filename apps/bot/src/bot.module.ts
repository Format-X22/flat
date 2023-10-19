import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandleModel } from './data/candle.model';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AnalyzerModule } from './analyzer/analyzer.module';
import { AdminModule } from './admin/admin.module';
import { TraderModule } from './trader/trader.module';
import { BotService } from './bot.service';
import { BotModel } from './data/bot.model';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotLogModel } from './data/bot-log.model';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TelegrafModule.forRootAsync({
            useFactory: async (configService: ConfigService) => ({
                token: configService.get<string>('F_TG_KEY'),
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                type: 'sqlite',
                database: 'base.db',
                key: configService.get('F_DB_KEY'),
                entities: [CandleModel, BotModel, BotLogModel],
                synchronize: true,
            }),
        }),
        AnalyzerModule,
        AdminModule,
        TraderModule,
    ],
    controllers: [],
    providers: [BotService],
})
export class BotModule {}
