import { Injectable } from '@nestjs/common';
import { BotsStatusDto } from './status.dto';

@Injectable()
export class StatusService {
    async getBotsStatus(): Promise<BotsStatusDto> {
        // TODO -
        return;
    }
}
