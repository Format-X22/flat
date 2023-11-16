import { BotModel, EState } from '../data/bot.model';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { sleep } from '../utils/sleep.util';
import { TraderExecutor } from './trader.executor';
import { BotLogModel, ELogType } from '../data/bot-log.model';
import { CalculatorService } from '../analyzer/calculator/calculator.service';
import { EDirection, TOrder } from '../data/order.type';
import { TActualOrder } from '../analyzer/detector/detector.dto';
import { seconds } from '../utils/time.util';

const ITERATION_TIMEOUT = seconds(10);
const DB_RETRY_TIMEOUT = seconds(30);

export class TraderIterator {
    private readonly logger: Logger = new Logger(TraderIterator.name);

    constructor(
        private bot: BotModel,
        private readonly botRepo: Repository<BotModel>,
        private readonly botLogRepo: Repository<BotLogModel>,
        private readonly executor: TraderExecutor,
        private readonly calculatorService: CalculatorService,
    ) {}

    async run(): Promise<void> {
        await this.logVerbose('Started');

        while (true) {
            try {
                await this.next();
            } catch (error) {
                try {
                    await this.emergencyDrop('on iteration');
                } catch (error) {
                    await this.logError('FATAL on try emergency stop on iteration error, stopping bot loop now');
                    break;
                }
            }

            try {
                await this.syncBot();
            } catch (error) {
                if (this.bot.state === EState.ERROR_EMERGENCY_STOP) {
                    this.logger.error(
                        'CRITICAL on save bot and emergency stop is activated, then go without db sync for now',
                    );
                } else {
                    this.logger.error('CRITICAL on save bot, try retry after timeout');
                    await sleep(DB_RETRY_TIMEOUT);

                    try {
                        await this.syncBot();
                    } catch (error) {
                        this.logger.error('CRITICAL on save bot after retry, just go without db sync for now');
                    }
                }
            }

            if (this.bot.state === EState.ERROR_EMERGENCY_STOP) {
                await sleep();
            } else {
                await sleep(ITERATION_TIMEOUT);
            }
        }
    }

    private async next(): Promise<void> {
        switch (this.bot.state) {
            case EState.INITIAL_INITIAL:
                await this.onInitialInitial();
                break;
            case EState.INITIAL_DEACTIVATED:
                await this.onInitialDeactivated();
                break;
            case EState.ERROR_ERROR:
                await this.onErrorError();
                break;
            case EState.ERROR_EMERGENCY_STOP:
                await this.onErrorEmergencyStop();
                break;

            case EState.WORKING_WAITING:
                await this.onWorkingWaiting();
                break;
            case EState.WORKING_DEACTIVATE:
                await this.onWorkingDeactivate();
                break;
            case EState.WORKING_CHECK_POSITION_COLLISION:
                await this.onWorkingCheckPositionCollision();
                break;
            case EState.WORKING_CHECK_BALANCE_CHANGE:
                await this.onWorkingCheckBalanceChange();
                break;

            case EState.CANDLE_CHECK_ANALYTICS:
                await this.onHandleCandleCheckAnalytics();
                break;
            default:
                await this.emergencyDrop('Invalid bot state');
                break;
        }
    }

    private async onInitialInitial(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.INITIAL_DEACTIVATED;
            return;
        }

        this.bot.state = EState.WORKING_WAITING;
    }

    private async onInitialDeactivated(): Promise<void> {
        if (this.bot.isActive) {
            this.bot.state = EState.INITIAL_INITIAL;
            return;
        }
    }

    private async onErrorError(): Promise<void> {
        if (this.bot.isActive) {
            this.bot.state = EState.INITIAL_INITIAL;
            return;
        }
    }

    private async onErrorEmergencyStop(): Promise<void> {
        await this.executor.closePosition();
        await this.executor.cancelAllOrders();
        await this.executor.closePosition();
        await this.logError(`Emergency stop for #${this.bot.id} bot`);

        this.bot.isActive = false;
        this.bot.state = EState.ERROR_ERROR;
    }

    private async onWorkingWaiting(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.WORKING_DEACTIVATE;
            return;
        }

        if (this.isTimeToCheckAnalytics()) {
            this.bot.state = EState.CANDLE_CHECK_ANALYTICS;
        }

        this.bot.state = EState.WORKING_CHECK_POSITION_COLLISION;
    }

    private async onWorkingDeactivate(): Promise<void> {
        await this.executor.closePosition();
        await this.executor.cancelAllOrders();
        await this.executor.closePosition();
        await this.logVerbose(`Stop for #${this.bot.id} bot`);

        this.bot.state = EState.INITIAL_DEACTIVATED;
    }

    private async onWorkingCheckPositionCollision(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.WORKING_DEACTIVATE;
            return;
        }

        if (await this.executor.hasPosition()) {
            // TODO Throw if position without analytics orders
            // TODO -
        }

        this.bot.state = EState.WORKING_CHECK_BALANCE_CHANGE;
    }

    private async onWorkingCheckBalanceChange(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.WORKING_DEACTIVATE;
            return;
        }

        if (await this.executor.hasNotPosition()) {
            if (typeof this.bot.lastBalance !== 'number') {
                this.bot.lastBalance = await this.executor.getBalance();
            }

            const currentBalance = await this.executor.getBalance();

            if (this.bot.lastBalance !== currentBalance) {
                await this.logTrade(`Balance ${this.bot.lastBalance} -> ${currentBalance}`);
                this.bot.lastBalance = currentBalance;

                this.bot.state = EState.CANDLE_CHECK_ANALYTICS;
                return;
            }
        }

        this.bot.state = EState.WORKING_WAITING;
    }

    private async onHandleCandleCheckAnalytics(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.WORKING_DEACTIVATE;
            return;
        }

        const { up, down } = await this.calculatorService.calc({ isSilent: true });
        const inPosition = await this.executor.hasPosition();

        if ((up || down) && inPosition) {
            await this.logError('Has position when only orders in analytics');
            this.bot.state = EState.ERROR_EMERGENCY_STOP;
            return;
        }

        const currentUpOrder = await this.executor.getUpOrder();
        const currentDownOrder = await this.executor.getDownOrder();

        if (up) {
            const order = this.actualToExecutor(up, EDirection.UP);

            if (currentUpOrder) {
                await this.executor.updateOrder(order);
            } else {
                await this.executor.placeOrder(order);
            }
        } else if (currentUpOrder) {
            await this.executor.cancelOrder(currentUpOrder);
        }

        if (down) {
            const order = this.actualToExecutor(down, EDirection.DOWN);

            if (currentDownOrder) {
                await this.executor.updateOrder(order);
            } else {
                await this.executor.placeOrder(order);
            }
        } else if (currentDownOrder) {
            await this.executor.cancelOrder(currentDownOrder);
        }

        this.bot.state = EState.WORKING_WAITING;
    }

    private actualToExecutor(actual: TActualOrder['up'] | TActualOrder['down'], direction: EDirection): TOrder {
        return {
            enter: actual.enter,
            take: actual.take,
            stop: actual.stop,
            direction,
            risk: this.bot.risk,
        };
    }

    private isTimeToCheckAnalytics(): boolean {
        // lastHandledCandle
        // TODO -
        return;
    }

    private async emergencyDrop(message: string): Promise<void> {
        this.logger.error(`CRITICAL [bot ${this.bot.id}] - ${message} - ${this.bot.state}`);

        this.bot.errorOnState = this.bot.state;
        this.bot.state = EState.ERROR_EMERGENCY_STOP;
    }

    private async syncBot(): Promise<void> {
        await this.botRepo.update(this.bot.id, {
            lastBalance: this.bot.lastBalance,
            state: this.bot.state,
            errorOnState: this.bot.errorOnState,
        });

        this.bot = await this.botRepo.findOneBy({ id: this.bot.id });
    }

    private async logVerbose(message: string): Promise<void> {
        this.logger.verbose(message);
        await this.tryDbLog(ELogType.VERBOSE, message);
    }

    private async logError(message: string): Promise<void> {
        this.logger.error(message);
        await this.tryDbLog(ELogType.ERROR, message);
    }

    private async logTrade(message: string): Promise<void> {
        this.logger.warn(message);
        await this.tryDbLog(ELogType.TRADE, message);
    }

    private async tryDbLog(type: ELogType, message: string): Promise<void> {
        try {
            const log = this.botLogRepo.create({
                bot: this.bot,
                type,
                message,
                date: new Date(),
            });

            await this.botLogRepo.save(log);
        } catch (error) {
            this.logger.error('Cant write to log - ' + error);
        }
    }
}
