import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Status')
@Controller('status')
export class StatusController {
    @Get()
    getStatus(): string {
        return 'OK';
    }
}
