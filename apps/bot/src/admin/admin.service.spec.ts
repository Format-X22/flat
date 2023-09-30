import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotModel, EPair, EStock } from '../data/bot.model';
import { CandleModel } from '../data/candle.model';
import { ConfigModule } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';

describe('AdminService', () => {
    let service: AdminService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: 'localhost',
                    port: 5432,
                    username: 'postgres',
                    password: 'postgres',
                    database: 'local',
                    entities: [CandleModel, BotModel],
                    synchronize: true,
                }),
                TypeOrmModule.forFeature([BotModel]),
                ConfigModule.forRoot({
                    isGlobal: true,
                }),
            ],
            providers: [AdminService],
        }).compile();

        service = module.get<AdminService>(AdminService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    async function createBot(): Promise<BotModel> {
        const id = await service.addBot({
            isActive: true,
            stock: EStock.TEST,
            pair: EPair.TEST,
            coldPercent: 0,
            apiKey: 'test',
        });
        expect(typeof id).toBe('number');

        const bot = await service.getBot(id);
        expect(bot.id).toBe(id);

        return bot;
    }

    async function deleteBot(id) {
        await service.deleteTestBot(id);
    }

    it('should be editable', async () => {
        const { id } = await createBot();
        const randomKey = 'test' + Math.random();

        await service.editBot(id, { apiKey: randomKey });
        const actualBot = await service.getBot(id);
        expect(actualBot.id).toBe(id);
        expect(actualBot.apiKey).toBe(randomKey);

        await deleteBot(id);
    });

    it('should be started and stopped', async () => {
        const { id } = await createBot();

        await service.stopBot(id);
        const stoppedBot = await service.getBot(id);
        expect(stoppedBot.isActive).toBeFalsy();

        await service.startBot(id);
        const startedBot = await service.getBot(id);
        expect(startedBot.isActive).toBeTruthy();

        await deleteBot(id);
    });

    it('should be registered pay', async () => {
        const { id } = await createBot();

        await service.registerPay(id, { amount: 100 });
        const bot = await service.getBot(id);
        expect(bot.payAmount).toBe(-100);

        await deleteBot(id);
    });

    it('should be ok with list', async () => {
        const { id } = await createBot();

        const bots = await service.getBots({});
        expect(bots.length).toBeGreaterThan(0);

        await deleteBot(id);
    });

    it('should be handle not found', async () => {
        const { id } = await createBot();

        await deleteBot(id);

        try {
            await service.getBot(id);
        } catch (error) {
            expect(error instanceof NotFoundException).toBe(true);
        }
    });

    it('should add owner and comment', async () => {
        const { id } = await createBot();
        const owner = 'test owner';
        const comment = 'test comment';

        await service.editBot(id, { owner, comment });

        const bot = await service.getBot(id);
        expect(bot.owner).toBe(owner);
        expect(bot.comment).toBe(comment);

        await deleteBot(id);
    });

    it('should cipher keys', async () => {
        const { id, apiKey: apiKeyOrigin } = await createBot();
        const apiKey = 'cipher-test';

        await service.editBot(id, { apiKey });
        const bot = await service.getBot(id);
        expect(bot.apiKey).not.toBe(apiKeyOrigin);

        await deleteBot(id);
    });
});
