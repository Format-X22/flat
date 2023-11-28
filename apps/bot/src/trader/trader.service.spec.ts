import { Test, TestingModule } from '@nestjs/testing';
import { TraderService } from './trader.service';
import { BotModel, EPair, EState, EStock } from '../data/bot.model';
import { BotLogModel } from '../data/bot-log.model';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyzerModule } from '../analyzer/analyzer.module';
import { CandleModel } from '../data/candle.model';
import { DataSource } from 'typeorm';
import { sleep } from '../utils/sleep.util';
import { ITERATION_TIMEOUT } from './trader.iterator';

describe('TraderService', () => {
    let service: TraderService;
    let botRepo: TraderService['botRepo'];
    let botLogRepo: TraderService['botLogRepo'];
    let bot: BotModel;

    function makeBot(): BotModel {
        return {
            id: 0,
            isActive: false,
            stock: EStock.TEST,
            pair: EPair.TEST,
            risk: 33,
            apiKey: 'TEST',
            state: EState.INITIAL_INITIAL,
            errorOnState: null,
            errorMessage: null,
            lastHandledCandle: 0,
            owner: 'TEST',
            lastBalance: 1000,
            logs: [],
        };
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

        botRepo = service['botRepo'];
        botLogRepo = service['botLogRepo'];
        bot = makeBot();

        jest.spyOn(botRepo, 'find').mockImplementation(async () => [bot]);
        jest.spyOn(botRepo, 'update').mockImplementation(async (id: any, updates: any): Promise<any> => {
            for (const [key, value] of Object.entries(updates)) {
                bot[key] = value;
            }
        });
        jest.spyOn(botRepo, 'findOneBy').mockImplementation(async () => bot);
        jest.spyOn(botLogRepo, 'create').mockReturnValue(null);
        jest.spyOn(botLogRepo, 'save').mockResolvedValue(null);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should just run with empty bots', async () => {
        await service.start();
    });

    it('should start with deactivated bot', async () => {
        await service.start();
        await sleep(ITERATION_TIMEOUT + 50);

        expect(bot.state).toBe(EState.INITIAL_DEACTIVATED);
    });

    it('should correct throw on error in next', async () => {
        //
    });

    it('should correct throw on emergency drop', async () => {
        //
    });

    it('should correct throw on sync', async () => {
        //
    });

    it('should correct throw on sync on emergency stop', async () => {
        //
    });

    it('should deactivate on all states', async () => {
        async function checkConstraint(state: EState): Promise<void> {
            bot = makeBot();
            bot.state = state;
            await service.start();
            await sleep(ITERATION_TIMEOUT + 10);
            expect(bot.state).toBe(EState.INITIAL_DEACTIVATED);
        }

        async function checkDoubleSteps(state: EState): Promise<void> {
            bot = makeBot();
            bot.state = state;

            await service.start();
            await sleep();
            expect(bot.state).toBe(EState.WORKING_DEACTIVATE);
            await sleep(ITERATION_TIMEOUT + 10);
            expect(bot.state).toBe(EState.INITIAL_DEACTIVATED);
        }

        await Promise.all([
            checkConstraint(EState.INITIAL_INITIAL),
            checkConstraint(EState.INITIAL_DEACTIVATED),
            checkConstraint(EState.ERROR_ERROR),
            checkDoubleSteps(EState.WORKING_WAITING),
            checkDoubleSteps(EState.WORKING_CHECK_POSITION_COLLISION),
            checkDoubleSteps(EState.WORKING_CHECK_BALANCE_CHANGE),
            checkDoubleSteps(EState.CANDLE_CHECK_ANALYTICS),
        ]);
    });

    it('should reactivate on deactivated by error', async () => {
        //
    });

    it('should reactivate on deactivated by error', async () => {
        //
    });

    it('should normal go', async () => {
        //
    });

    it('should go inside analysis', async () => {
        //
    });

    it('should handle position collision', async () => {
        //
    });

    it('should handle balance change', async () => {
        //
    });
});
