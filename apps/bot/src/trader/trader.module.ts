import { Module } from '@nestjs/common';
import { TraderService } from './trader.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModel } from '../data/bot.model';
import { BotLogModel } from '../data/bot-log.model';

@Module({
    imports: [TypeOrmModule.forFeature([BotModel, BotLogModel])],
    providers: [TraderService],
    exports: [TraderService],
})
export class TraderModule {}
