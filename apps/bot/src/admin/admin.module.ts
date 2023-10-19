import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModel } from '../data/bot.model';
import { AdminScenario } from './admin.scenario';
import { BotLogModel } from '../data/bot-log.model';

@Module({
    imports: [TypeOrmModule.forFeature([BotModel, BotLogModel])],
    providers: [AdminService, AdminScenario],
})
export class AdminModule {}
