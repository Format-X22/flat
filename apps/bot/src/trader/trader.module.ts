import { Module } from '@nestjs/common';
import { TraderService } from './trader.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModel } from '../data/bot.model';
import { BotLogModel } from '../data/bot-log.model';
import { AnalyzerModule } from '../analyzer/analyzer.module';

@Module({
    imports: [TypeOrmModule.forFeature([BotModel, BotLogModel]), AnalyzerModule],
    providers: [TraderService],
    exports: [TraderService],
})
export class TraderModule {}
