import { Injectable } from '@nestjs/common';
import {
    AddBotArgs,
    AddManualDealArgs, BotDto,
    CancelDealArgs,
    EditBotArgs,
    GetBotListArgs,
    RegisterPayArgs,
} from './admin.dto';

@Injectable()
export class AdminService {
    async startBot(id: number): Promise<void> {
        // TODO -
    }

    async stopBot(id: number): Promise<void> {
        // TODO -
    }

    async registerPay(id: number, body: RegisterPayArgs): Promise<void> {
        // TODO -
    }

    async cancelDeal(body: CancelDealArgs): Promise<void> {
        // TODO -
    }

    async addManualDeal(body: AddManualDealArgs): Promise<void> {
        // TODO -
    }

    async getBots(query: GetBotListArgs): Promise<Array<BotDto>> {
        // TODO -
        return;
    }

    async getBot(id: number): Promise<BotDto> {
        // TODO -
        return;
    }

    async addBot(body: AddBotArgs): Promise<void> {
        // TODO -
    }

    async editBot(id: number, body: EditBotArgs): Promise<void> {
        // TODO -
    }

    async deleteBot(id: number): Promise<void> {
        // TODO -
    }
}
