import { Module } from '@nestjs/common';
import { TraderService } from './trader.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModel } from '../data/bot.model';

@Module({
    imports: [TypeOrmModule.forFeature([BotModel])],
    providers: [TraderService],
})
export class TraderModule {}
