import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AddBotArgs, EditBotArgs, GetBotListArgs, RegisterPayArgs } from './admin.dto';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { BotModel } from '../data/bot.model';

@ApiSecurity('session')
@ApiTags('Bot management')
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(private adminService: AdminService) {}

    @Post('bots/:id/start')
    async startBot(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.adminService.startBot(id);
    }

    @Post('bots/:id/stop')
    async stopBot(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.adminService.stopBot(id);
    }

    @Post('bots/:id/register-pay')
    async registerPay(@Param('id', ParseIntPipe) id: number, @Body() body: RegisterPayArgs): Promise<void> {
        await this.adminService.registerPay(id, body);
    }

    @Get('bots')
    async getBots(@Query() query: GetBotListArgs): Promise<Array<BotModel>> {
        return this.adminService.getBots(query);
    }

    @Get('bots/:id')
    async getBot(@Param('id', ParseIntPipe) id: number): Promise<BotModel> {
        return this.adminService.getBot(id);
    }

    @Post('bots')
    async addBot(@Body() body: AddBotArgs): Promise<BotModel['id']> {
        return this.adminService.addBot(body);
    }

    @Patch('bots/:id')
    async editBot(@Param('id', ParseIntPipe) id: number, @Body() body: EditBotArgs): Promise<void> {
        await this.adminService.editBot(id, body);
    }
}
