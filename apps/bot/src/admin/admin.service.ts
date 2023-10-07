import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AddBotArgs, EditBotArgs, GetBotListArgs, RegisterPayArgs } from './admin.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BotModel, EState, EStock } from '../data/bot.model';
import { Repository } from 'typeorm';
import { scrypt, randomFill, createCipheriv } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

const CIPHER_TYPE = 'aes-256-cbc';
const CIPHER_SALT = 'Y&31#.azp,$D!!*22ds_E4@';

@Injectable()
export class AdminService {
    private readonly cipherKey: string;

    constructor(
        @InjectRepository(BotModel) private botRepo: Repository<BotModel>,
        private configService: ConfigService,
    ) {
        this.cipherKey = this.configService.get('F_BOT_KEY_PASS');
    }

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
            const bot = await entityManager.findOne(BotModel, { where: { id } });

            if (!bot) {
                isNotFound = true;
                return;
            }

            await entityManager.update(BotModel, { id }, { payAmount: bot.payAmount - body.amount });
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
        body.apiKey = await this.makeCipherKey(body.apiKey);

        const bot = await this.botRepo.save(
            this.botRepo.create({
                ...body,
                payAmount: 0,
                state: EState.INITIAL_INITIAL,
            }),
        );

        return bot.id;
    }

    async editBot(id: number, body: EditBotArgs): Promise<void> {
        if (body.apiKey) {
            body.apiKey = await this.makeCipherKey(body.apiKey);
        }

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

    private makeCipherKey(apiKey: string): Promise<string> {
        return new Promise((resolve, reject) => {
            scrypt(this.cipherKey, CIPHER_SALT, 32, (error, key) => {
                if (error) {
                    reject(error);
                }

                randomFill(new Uint8Array(16), (error, iv) => {
                    if (error) {
                        reject(error);
                    }

                    const cipher = createCipheriv(CIPHER_TYPE, key, iv);

                    let encrypted = '';

                    cipher.setEncoding('hex');
                    cipher.on('data', (chunk) => (encrypted += chunk));
                    cipher.on('end', () => resolve(encrypted));
                    cipher.write(apiKey);
                    cipher.end();
                });
            });
        });
    }
}
