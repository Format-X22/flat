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
import { EDirection } from '../data/order.type';
import { TraderExecutor } from './trader.executor';
import { CalculatorService } from '../analyzer/calculator/calculator.service';
import { Logger } from '@nestjs/common';

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

    describe('handle analysis', () => {
        const order: any = {};
        let executor: TraderExecutor;
        let calculator: CalculatorService;
        let logger: Logger;

        async function initAndRun() {
            const bot = initBot();

            bot.isActive = true;
            bot.state = EState.CANDLE_CHECK_ANALYTICS;

            await service.start();

            executor = service.iterators[0]['executor'];
            calculator = service.iterators[0]['calculatorService'];
            logger = service.iterators[0]['logger'];

            return bot;
        }

        function makeOrderHandlers() {
            const handled = { isUpdated: false, isPlaced: false, isCancelled: false };

            jest.spyOn(executor, 'updateOrder').mockImplementation(async () => {
                handled.isUpdated = true;
            });
            jest.spyOn(executor, 'placeOrder').mockImplementation(async () => {
                handled.isPlaced = true;
            });
            jest.spyOn(executor, 'cancelOrder').mockImplementation(async () => {
                handled.isCancelled = true;
            });

            return handled;
        }

        function mockState(hasUp, hasDown, calcUp, calcDown, position = null) {
            jest.spyOn(executor, 'getPosition').mockImplementation(async () => position);
            jest.spyOn(executor, 'hasUpOrder').mockImplementation(async () => hasUp);
            jest.spyOn(executor, 'hasDownOrder').mockImplementation(async () => hasUp);
            jest.spyOn(calculator, 'calc').mockResolvedValue({ up: calcUp, down: calcDown });
        }

        it('should throw on position', async () => {
            const bot = await initAndRun();
            const logs: Array<string> = [];
            const { isUpdated, isPlaced, isCancelled } = makeOrderHandlers();

            mockState(null, null, order, null, {});

            jest.spyOn(logger, 'error').mockImplementation((value: string) => {
                logs.push(value);
            });

            await sleep();

            expect(bot.state).toBe(EState.ERROR_EMERGENCY_STOP);
            expect(logs.length).toBe(1);
            expect(isUpdated).toBe(false);
            expect(isPlaced).toBe(false);
            expect(isCancelled).toBe(false);
        });

        it('should pass up order', async () => {
            const bot = await initAndRun();
            const { isUpdated, isPlaced, isCancelled } = makeOrderHandlers();

            mockState(order, null, null, null);

            await sleep();

            //expect(bot.state).toBe(EState.WORKING_WAITING);
            //expect(isUpdated).toBe(false);
            //expect(isPlaced).toBe(false);
            //expect(isCancelled).toBe(true);
        });

        it('should pass up order and up analysis', async () => {
            const bot = await initAndRun();
            const { isUpdated, isPlaced, isCancelled } = makeOrderHandlers();

            mockState(order, null, order, null);

            await sleep();

            expect(bot.state).toBe(EState.WORKING_WAITING);
            expect(isUpdated).toBe(true);
            expect(isPlaced).toBe(false);
            expect(isCancelled).toBe(false);
        });

        it('should pass up analysis', async () => {
            const bot = await initAndRun();
            const { isUpdated, isPlaced, isCancelled } = makeOrderHandlers();

            mockState(null, null, order, null);

            await sleep();

            expect(bot.state).toBe(EState.WORKING_WAITING);
            expect(isUpdated).toBe(false);
            expect(isPlaced).toBe(true);
            expect(isCancelled).toBe(false);
        });

        it('should pass down order', async () => {
            const bot = await initAndRun();
            const { isUpdated, isPlaced, isCancelled } = makeOrderHandlers();

            mockState(null, order, null, null);

            await sleep();

            expect(bot.state).toBe(EState.WORKING_WAITING);
            expect(isUpdated).toBe(false);
            expect(isPlaced).toBe(false);
            expect(isCancelled).toBe(true);
        });

        it('should pass down order and down analysis', async () => {
            const bot = await initAndRun();
            const { isUpdated, isPlaced, isCancelled } = makeOrderHandlers();

            mockState(null, order, null, order);

            await sleep();

            expect(bot.state).toBe(EState.WORKING_WAITING);
            expect(isUpdated).toBe(true);
            expect(isPlaced).toBe(false);
            expect(isCancelled).toBe(false);
        });

        it('should pass down analysis', async () => {
            const bot = await initAndRun();
            const { isUpdated, isPlaced, isCancelled } = makeOrderHandlers();

            mockState(null, null, null, order);
            await sleep();

            expect(bot.state).toBe(EState.WORKING_WAITING);
            expect(isUpdated).toBe(false);
            expect(isPlaced).toBe(true);
            expect(isCancelled).toBe(false);
        });

        it('should pass without orders and analysis', async () => {
            const bot = await initAndRun();
            const { isUpdated, isPlaced, isCancelled } = makeOrderHandlers();

            mockState(null, null, null, null);

            await sleep();

            expect(bot.state).toBe(EState.WORKING_WAITING);
            expect(isUpdated).toBe(false);
            expect(isPlaced).toBe(false);
            expect(isCancelled).toBe(false);
        });

        it('should pass with all orders and analysis', async () => {
            const bot = await initAndRun();
            let updatedCount = 0;
            let placedCount = 0;
            let cancelledCount = 0;

            jest.spyOn(executor, 'updateOrder').mockImplementation(async () => {
                updatedCount++;
            });
            jest.spyOn(executor, 'placeOrder').mockImplementation(async () => {
                placedCount++;
            });
            jest.spyOn(executor, 'cancelOrder').mockImplementation(async () => {
                cancelledCount++;
            });

            mockState(order, order, order, order);

            await sleep();

            expect(bot.state).toBe(EState.WORKING_WAITING);
            expect(updatedCount).toBe(2);
            expect(placedCount).toBe(0);
            expect(cancelledCount).toBe(0);
        });
    });

    describe('handle position collision', () => {
        const upPosition: any = { direction: EDirection.UP };
        const downPosition: any = { direction: EDirection.DOWN };
        const order: any = {};
        let executor: TraderExecutor;
        let calculator: CalculatorService;
        let logger: Logger;

        async function initAndRun() {
            const bot = initBot();

            bot.isActive = true;
            bot.state = EState.WORKING_CHECK_POSITION_COLLISION;

            await service.start();

            executor = service.iterators[0]['executor'];
            calculator = service.iterators[0]['calculatorService'];
            logger = service.iterators[0]['logger'];

            return bot;
        }

        it('should handle position collision without orders', async () => {
            const bot = await initAndRun();

            jest.spyOn(executor, 'getPosition').mockImplementation(async () => ({} as any));
            jest.spyOn(calculator, 'calc').mockResolvedValue({ up: null, down: null });

            await sleep();

            expect(bot.state).toBe(EState.WORKING_CHECK_BALANCE_CHANGE);
        });

        it('should with up order and up position', async () => {
            const bot = await initAndRun();

            jest.spyOn(executor, 'getPosition').mockImplementation(async () => upPosition);
            jest.spyOn(calculator, 'calc').mockResolvedValue({ up: order, down: null });

            await sleep();

            expect(bot.state).toBe(EState.WORKING_CHECK_BALANCE_CHANGE);
        });

        it('should with up order and down position', async () => {
            const bot = await initAndRun();
            const logs: Array<string> = [];

            jest.spyOn(executor, 'getPosition').mockImplementation(async () => downPosition);
            jest.spyOn(calculator, 'calc').mockResolvedValue({ up: order, down: null });
            jest.spyOn(logger, 'error').mockImplementation((value: string) => {
                logs.push(value);
            });

            await sleep();

            expect(bot.state).toBe(EState.ERROR_EMERGENCY_STOP);
            expect(logs.length).toBe(1);
        });

        it('should with down order and down position', async () => {
            const bot = await initAndRun();

            jest.spyOn(executor, 'getPosition').mockImplementation(async () => downPosition);
            jest.spyOn(calculator, 'calc').mockResolvedValue({ up: null, down: order });

            await sleep();

            expect(bot.state).toBe(EState.WORKING_CHECK_BALANCE_CHANGE);
        });

        it('should with down order and up position', async () => {
            const bot = await initAndRun();
            const logs: Array<string> = [];

            jest.spyOn(executor, 'getPosition').mockImplementation(async () => upPosition);
            jest.spyOn(calculator, 'calc').mockResolvedValue({ up: null, down: order });
            jest.spyOn(logger, 'error').mockImplementation((value: string) => {
                logs.push(value);
            });

            await sleep();

            expect(bot.state).toBe(EState.ERROR_EMERGENCY_STOP);
            expect(logs.length).toBe(1);
        });

        it('should with bidirectional orders and up position', async () => {
            const bot = await initAndRun();
            let isCanceled = false;

            jest.spyOn(executor, 'getPosition').mockImplementation(async () => upPosition);
            jest.spyOn(calculator, 'calc').mockResolvedValue({ up: order, down: order });
            jest.spyOn(executor, 'cancelOrder').mockImplementation(async () => {
                isCanceled = true;
            });

            await sleep();

            expect(isCanceled).toBe(true);
            expect(bot.state).toBe(EState.WORKING_CHECK_BALANCE_CHANGE);
        });

        it('should with bidirectional orders and down position', async () => {
            const bot = await initAndRun();
            let isCanceled = false;

            jest.spyOn(executor, 'getPosition').mockImplementation(async () => downPosition);
            jest.spyOn(calculator, 'calc').mockResolvedValue({ up: order, down: order });
            jest.spyOn(executor, 'cancelOrder').mockImplementation(async () => {
                isCanceled = true;
            });

            await sleep();

            expect(isCanceled).toBe(true);
            expect(bot.state).toBe(EState.WORKING_CHECK_BALANCE_CHANGE);
        });
    });

    it('should handle balance change', async () => {
        const bot = initBot();
        const lastBalance = 1_000;
        const currentBalance = 2_000;
        const logs: Array<string> = [];

        bot.isActive = true;
        bot.state = EState.WORKING_CHECK_BALANCE_CHANGE;
        bot.lastBalance = lastBalance;

        await service.start();

        const executor = service.iterators[0]['executor'];

        jest.spyOn(executor, 'getPosition').mockImplementation(async () => null);
        jest.spyOn(executor, 'getBalance').mockImplementation(async () => currentBalance);
        jest.spyOn(service.iterators[0], 'logTrade' as any).mockImplementation(async (msg: string) => logs.push(msg));

        await sleep();

        expect(logs[0]).toBe(`Balance ${lastBalance} -> ${currentBalance}`);
        expect(bot.state).toBe(EState.CANDLE_CHECK_ANALYTICS);
        expect(bot.lastBalance).toBe(currentBalance);
    });
});
