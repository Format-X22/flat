import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModel } from '../data/bot.model';

@Module({
    imports: [TypeOrmModule.forFeature([BotModel])],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule {}
