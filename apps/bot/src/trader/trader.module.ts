import { Module } from '@nestjs/common';
import { TraderService } from './trader.service';
import { TelegramModule } from '../telegram/telegram.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LoaderModule } from '../loader/loader.module';
import { AnalyzerModule } from '../analyzer/analyzer.module';

@Module({
    imports: [TelegramModule, LoaderModule, AnalyzerModule, ScheduleModule.forRoot()],
    providers: [TraderService],
    exports: [TraderService],
})
export class TraderModule {}
