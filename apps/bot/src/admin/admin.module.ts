import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModel } from '../data/bot.model';
import { AdminScenario } from './admin.scenario';

@Module({
    imports: [TypeOrmModule.forFeature([BotModel])],
    providers: [AdminService, AdminScenario],
})
export class AdminModule {}
