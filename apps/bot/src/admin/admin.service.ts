import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AddBotArgs, EditBotArgs, GetBotListArgs, RegisterPayArgs } from './admin.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BotModel, EState, EStock } from '../data/bot.model';
import { Repository } from 'typeorm';

@Injectable()
export class AdminService {
    constructor(@InjectRepository(BotModel) private botRepo: Repository<BotModel>) {}

    async startBot(id: number): Promise<void> {
        const result = await this.botRepo.update({ id }, { isActive: true });

        if (!result.affected) {
            this.throwNotFound(id);
        }
    }

    async stopBot(id: number): Promise<void> {
        const result = await this.botRepo.update({ id }, { isActive: false });

        if (!result.affected) {
            this.throwNotFound(id);
        }
    }

    async registerPay(id: number, body: RegisterPayArgs): Promise<void> {
        let isNotFound = false;

        await this.botRepo.manager.transaction(async (entityManager) => {
            const bot = await this.botRepo.findOne({ where: { id } });

            if (!bot) {
                isNotFound = true;
                return;
            }

            await this.botRepo.update({ id }, { payAmount: bot.payAmount - body.amount });
        });

        if (isNotFound) {
            this.throwNotFound(id);
        }
    }

    async getBots(body: GetBotListArgs): Promise<Array<BotModel>> {
        if (typeof body?.isActive === 'boolean') {
            return this.botRepo.find({ where: { isActive: true } });
        } else {
            return this.botRepo.find();
        }
    }

    async getBot(id: number): Promise<BotModel> {
        return this.botRepo.findOne({ where: { id } });
    }

    async addBot(body: AddBotArgs): Promise<BotModel['id']> {
        const bot = await this.botRepo.save(
            this.botRepo.create({
                ...body,
                payAmount: 0,
                state: EState.INITIAL,
            }),
        );

        return bot.id;
    }

    async editBot(id: number, body: EditBotArgs): Promise<void> {
        const result = await this.botRepo.update({ id }, body);

        if (!result.affected) {
            this.throwNotFound(id);
        }
    }

    async deleteTestBot(id: number): Promise<void> {
        const bot = await this.botRepo.findOne({ where: { id } });

        if (!bot) {
            this.throwNotFound(id);
        }

        if (bot.stock !== EStock.TEST) {
            throw new ForbiddenException('This is not test bot');
        }

        await this.botRepo.delete({ id });
    }

    private throwNotFound(id: BotModel['id']): never {
        throw new NotFoundException(`Unknown bot ${id}`);
    }
}
