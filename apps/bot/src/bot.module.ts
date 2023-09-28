import { Module } from '@nestjs/common';
import { StatusModule } from './status/status.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandleModel } from './data/candle.model';
import { ConfigModule } from '@nestjs/config';
import { AnalyzerModule } from './analyzer/analyzer.module';
import { AdminModule } from './admin/admin.module';
import { TraderModule } from './trader/trader.module';
import { BotService } from './bot.service';
import { BotModel } from './data/bot.model';

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
            entities: [CandleModel, BotModel],
            synchronize: true,
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        AnalyzerModule,
        AdminModule,
        TraderModule,
    ],
    controllers: [],
    providers: [BotService],
})
export class BotModule {}
