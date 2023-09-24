import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatusService } from './status.service';
import { BotsStatusDto } from './status.dto';

@ApiTags('Status')
@Controller('status')
export class StatusController {
    constructor(private statusService: StatusService) {}

    @Get('bots')
    async getBotsStatus(): Promise<BotsStatusDto> {
        return this.statusService.getBotsStatus();
    }

    @Get()
    getStatus(): string {
        return 'OK';
    }
}
