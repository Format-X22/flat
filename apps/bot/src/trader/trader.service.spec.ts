import { Test, TestingModule } from '@nestjs/testing';
import { TraderService } from './trader.service';
import { BotModel, EPair, EState, EStock } from '../data/bot.model';
import { BotLogModel } from '../data/bot-log.model';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyzerModule } from '../analyzer/analyzer.module';
import { CandleModel } from '../data/candle.model';
import { DataSource } from 'typeorm';
import { sleep } from '../utils/sleep.util';
import { DB_RETRY_TIMEOUT, ERROR_EMERGENCY_TIMEOUT, ITERATION_TIMEOUT } from './trader.iterator';
import { TraderExecutor } from './trader.executor';

describe('TraderService', () => {
    let service: TraderService;

    function initBot(): BotModel {
        const bot = {
            id: 0,
            isActive: false,
            stock: EStock.TEST,
            pair: EPair.TEST,
            risk: 33,
            cold: 33,
            publicKey: 'TEST',
            privateKey: 'TEST',
            state: EState.INITIAL_INITIAL,
            errorOnState: null,
            errorMessage: null,
            lastHandledCandle: 0,
            owner: 'TEST',
            lastBalance: 1000,
            logs: [],
        };

        const botRepo = service['botRepo'];
        const botLogRepo = service['botLogRepo'];

        jest.spyOn(botRepo, 'find').mockImplementation(async () => [bot]);
        jest.spyOn(botRepo, 'update').mockImplementation(async (id: any, updates: any): Promise<any> => {
            for (const [key, value] of Object.entries(updates)) {
                bot[key] = value;
            }
        });
        jest.spyOn(botRepo, 'findOneBy').mockImplementation(async () => bot);
        jest.spyOn(botLogRepo, 'create').mockReturnValue(null);
        jest.spyOn(botLogRepo, 'save').mockResolvedValue(null);

        return bot;
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [AnalyzerModule],
            providers: [TraderService],
        })
            .useMocker((token) => {
                if (token === DataSource) {
                    return {
                        entityMetadatas: {
                            find: () => [],
                        },
                        options: {},
                        getRepository: () => void 0,
                    };
                }
                if (token === getRepositoryToken(BotModel)) {
                    return {
                        find: () => [],
                        update: async () => void 0,
                        findOneBy: async () => void 0,
                    };
                }
                if (token === getRepositoryToken(BotLogModel)) {
                    return {
                        create: () => () => void 0,
                        save: () => async () => void 0,
                    };
                }
                if (token === getRepositoryToken(CandleModel)) {
                    return {
                        find: () => [],
                    };
                }
            })
            .compile();

        service = module.get<TraderService>(TraderService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should just run with empty bots', async () => {
        initBot();

        await service.start();
    });

    it('should start with deactivated bot', async () => {
        const bot = initBot();

        await service.start();
        await sleep(ITERATION_TIMEOUT + 50);

        expect(bot.state).toBe(EState.INITIAL_DEACTIVATED);
    });

    it('should correct throw on error in next', async () => {
        const bot = initBot();
        const logs = [];

        await service.start();

        jest.spyOn(service.iterators[0], 'next' as any).mockImplementation(() => {
            throw 'TEST';
        });
        jest.spyOn(service.iterators[0]['logger'], 'error').mockImplementation((value: string) => {
            logs.push(value);
        });

        await sleep();
        expect(bot.state).toBe(EState.ERROR_EMERGENCY_STOP);
        expect(bot.errorOnState).toBe(EState.INITIAL_INITIAL);

        await sleep(ERROR_EMERGENCY_TIMEOUT + 50);
        expect(bot.state).toBe(EState.ERROR_EMERGENCY_STOP);
        expect(bot.errorOnState).toBe(EState.ERROR_EMERGENCY_STOP);
        expect(service.iterators[0].isRunning).toBe(true);

        await sleep(ERROR_EMERGENCY_TIMEOUT + 50);
        expect(service.iterators[0].isRunning).toBe(false);
        expect(logs.length).toBe(3);

        await sleep(ITERATION_TIMEOUT * 2 + 50);
        expect(service.iterators[0].isRunning).toBe(false);
        expect(logs.length).toBe(3);
    });

    it('should correct throw on sync', async () => {
        const bot = initBot();
        const logs: Array<string> = [];

        bot.state = EState.INITIAL_INITIAL;

        await service.start();

        jest.spyOn(service.iterators[0], 'syncBot' as any).mockImplementation(() => {
            throw 'TEST';
        });
        jest.spyOn(service.iterators[0]['logger'], 'error').mockImplementation((value: string) => {
            logs.push(value);
        });

        expect(bot.state).toBe(EState.INITIAL_INITIAL);
        expect(logs.length).toBe(0);
        await sleep();
        expect(logs.length).toBe(1);
        await sleep(DB_RETRY_TIMEOUT + 10);
        expect(logs.length).toBe(2);
        expect(logs[1].indexOf('go without db sync for now')).toBeGreaterThan(-1);
        expect(service.iterators[0].isRunning).toBe(true);
        await sleep(ITERATION_TIMEOUT * 2 + 50);
        expect(service.iterators[0].isRunning).toBe(true);
    });

    it('should correct throw on sync on emergency stop', async () => {
        const bot = initBot();
        const logs: Array<string> = [];

        await service.start();

        jest.spyOn(service.iterators[0], 'syncBot' as any).mockImplementation(() => {
            bot.state = EState.ERROR_EMERGENCY_STOP;
            throw 'TEST';
        });
        jest.spyOn(service.iterators[0]['logger'], 'error').mockImplementation((value: string) => {
            logs.push(value);
        });

        expect(logs.length).toBe(0);
        await sleep();
        expect(logs.length).toBe(1);
        expect(logs[0].indexOf('go without db sync for now')).toBeGreaterThan(-1);
        expect(service.iterators[0].isRunning).toBe(true);
        await sleep(ITERATION_TIMEOUT * 2 + 50);
        expect(service.iterators[0].isRunning).toBe(true);
    });

    it('should deactivate on INITIAL_INITIAL state', async () => {
        const bot = initBot();

        bot.state = EState.INITIAL_INITIAL;

        await service.start();
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.INITIAL_DEACTIVATED);
    });

    it('should deactivate on INITIAL_DEACTIVATED state', async () => {
        const bot = initBot();

        bot.state = EState.INITIAL_DEACTIVATED;

        await service.start();
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.INITIAL_DEACTIVATED);
    });

    it('should deactivate on ERROR_ERROR state', async () => {
        const bot = initBot();

        bot.state = EState.ERROR_ERROR;

        await service.start();
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.ERROR_ERROR);
    });

    it('should deactivate on WORKING_WAITING state', async () => {
        const bot = initBot();

        bot.state = EState.WORKING_WAITING;

        await service.start();
        await sleep();
        expect(bot.state).toBe(EState.WORKING_DEACTIVATE);
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.INITIAL_DEACTIVATED);
    });

    it('should deactivate on WORKING_CHECK_POSITION_COLLISION state', async () => {
        const bot = initBot();

        bot.state = EState.WORKING_CHECK_POSITION_COLLISION;

        await service.start();
        await sleep();
        expect(bot.state).toBe(EState.WORKING_DEACTIVATE);
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.INITIAL_DEACTIVATED);
    });

    it('should deactivate on WORKING_CHECK_BALANCE_CHANGE state', async () => {
        const bot = initBot();

        bot.state = EState.WORKING_CHECK_BALANCE_CHANGE;

        await service.start();
        await sleep();
        expect(bot.state).toBe(EState.WORKING_DEACTIVATE);
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.INITIAL_DEACTIVATED);
    });

    it('should deactivate on CANDLE_CHECK_ANALYTICS state', async () => {
        const bot = initBot();

        bot.state = EState.CANDLE_CHECK_ANALYTICS;

        await service.start();
        await sleep();
        expect(bot.state).toBe(EState.WORKING_DEACTIVATE);
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.INITIAL_DEACTIVATED);
    });

    it('should reactivate on deactivated by deactivate', async () => {
        const bot = initBot();

        bot.isActive = false;
        bot.state = EState.INITIAL_DEACTIVATED;

        await service.start();
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.INITIAL_DEACTIVATED);

        bot.isActive = true;
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.INITIAL_INITIAL);
    });

    it('should reactivate on deactivated by error', async () => {
        const bot = initBot();

        bot.isActive = false;
        bot.state = EState.ERROR_ERROR;

        await service.start();
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.ERROR_ERROR);

        bot.isActive = true;
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.INITIAL_INITIAL);
    });

    it('should normal go', async () => {
        const bot = initBot();

        bot.isActive = true;
        bot.state = EState.INITIAL_INITIAL;

        await service.start();

        jest.spyOn(service.iterators[0], 'isTimeToCheckAnalytics' as any).mockReturnValue(false);
        jest.spyOn(service.iterators[0]['calculatorService'], 'calc').mockResolvedValue({ up: null, down: null });

        const executor = service.iterators[0]['executor'];

        jest.spyOn(executor, 'hasUpOrder').mockImplementation(async () => void 0);
        jest.spyOn(executor, 'hasDownOrder').mockImplementation(async () => void 0);
        jest.spyOn(executor, 'updateOrder').mockImplementation(async () => void 0);
        jest.spyOn(executor, 'placeOrder').mockImplementation(async () => void 0);
        jest.spyOn(executor, 'cancelOrder').mockImplementation(async () => void 0);
        jest.spyOn(executor, 'cancelAllOrders').mockImplementation(async () => void 0);
        jest.spyOn(executor, 'getPosition').mockImplementation(async () => null);
        jest.spyOn(executor, 'closePosition').mockImplementation(async () => void 0);
        jest.spyOn(executor, 'getBalance').mockImplementation(async () => bot.lastBalance);

        await sleep();
        expect(bot.state).toBe(EState.WORKING_WAITING);
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.WORKING_CHECK_POSITION_COLLISION);
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.WORKING_CHECK_BALANCE_CHANGE);
        await sleep(ITERATION_TIMEOUT + 10);
        expect(bot.state).toBe(EState.WORKING_WAITING);
    });

    it('should go inside analysis', async () => {
        // TODO -
    });

    it('should handle position collision', async () => {
        // TODO -
    });

    it('should handle balance change', async () => {
        // TODO -
    });
});
