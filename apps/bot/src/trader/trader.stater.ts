import { BotModel, EState } from '../data/bot.model';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { sleep } from '../utils/sleep.util';
import { TraderExecutor } from './trader.executor';

const ITERATION_TIMEOUT = 10_000;
const DB_RETRY_TIMEOUT = 30_000;

export class TraderStater {
    private readonly logger: Logger = new Logger(TraderStater.name);

    constructor(
        private readonly bot: BotModel,
        private readonly botRepo: Repository<BotModel>,
        private readonly executor: TraderExecutor,
    ) {}

    async run(): Promise<void> {
        while (true) {
            try {
                await this.next();
            } catch (error) {
                try {
                    await this.emergencyDrop('on iteration');
                } catch (error) {
                    this.logger.error('FATAL on try emergency stop on iteration error, stopping bot loop now');
                    break;
                }
            }

            try {
                await this.saveBot();
            } catch (error) {
                if (this.bot.state === EState.ERROR_EMERGENCY_STOP) {
                    this.logger.error(
                        'CRITICAL on save bot and emergency stop is activated, then go without db sync for now',
                    );
                } else {
                    this.logger.error('CRITICAL on save bot, try retry after timeout');
                    await sleep(DB_RETRY_TIMEOUT);

                    try {
                        await this.saveBot();
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
            case EState.WORKING_CHECK_PAYMENT_REQUIRES:
                await this.onWorkingCheckPaymentRequires();
                break;
            case EState.CANDLE_CHECK_ANALYTICS:
                await this.onHandleCandleCheckAnalytics();
                break;
            case EState.CANDLE_CHECK_POSITION_WRONG_EXISTS:
                await this.onHandleCandleCheckPositionWrongExists();
                break;
            case EState.CANDLE_CANCEL_ORDERS:
                await this.onHandleCandleCancelOrders();
                break;
            case EState.CANDLE_PLACE_ORDERS:
                await this.onHandleCandlePlaceOpOrder();
                break;
            case EState.CANDLE_REPLACE_STOP:
                await this.onHandleCandleReplaceStop();
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
        // TODO -

        this.bot.isActive = false;
        this.bot.state = EState.ERROR_ERROR;
    }

    private async onWorkingWaiting(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.WORKING_DEACTIVATE;
            return;
        }

        // TODO Check time to handle candle
        // lastHandledCandle

        // TODO -

        this.bot.state = EState.WORKING_CHECK_POSITION_COLLISION;
    }

    private async onWorkingDeactivate(): Promise<void> {
        // TODO cancel all

        this.bot.state = EState.INITIAL_DEACTIVATED;
    }

    private async onWorkingCheckPositionCollision(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.WORKING_DEACTIVATE;
            return;
        }

        // TODO -

        this.bot.state = EState.WORKING_CHECK_BALANCE_CHANGE;
    }

    private async onWorkingCheckBalanceChange(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.WORKING_DEACTIVATE;
            return;
        }

        // TODO -

        this.bot.state = EState.WORKING_CHECK_PAYMENT_REQUIRES;
    }

    private async onWorkingCheckPaymentRequires(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.WORKING_DEACTIVATE;
            return;
        }

        // TODO -

        this.bot.state = EState.WORKING_WAITING;
    }

    private async onHandleCandleCheckAnalytics(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.WORKING_DEACTIVATE;
            return;
        }

        // TODO -

        this.bot.state = EState.CANDLE_CHECK_POSITION_WRONG_EXISTS;
    }

    private async onHandleCandleCheckPositionWrongExists(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.WORKING_DEACTIVATE;
            return;
        }

        // TODO -

        this.bot.state = EState.CANDLE_CANCEL_ORDERS;
    }

    private async onHandleCandleCancelOrders(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.WORKING_DEACTIVATE;
            return;
        }

        // Do not cancel if no changes
        // Edit only size if size changes
        // For save position in glass
        // TODO -

        this.bot.state = EState.CANDLE_PLACE_ORDERS;
    }

    private async onHandleCandlePlaceOpOrder(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.WORKING_DEACTIVATE;
            return;
        }

        // TODO -

        this.bot.state = EState.CANDLE_REPLACE_STOP;
    }

    private async onHandleCandleReplaceStop(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.state = EState.WORKING_DEACTIVATE;
            return;
        }

        // TODO -

        this.bot.state = EState.WORKING_WAITING;
    }

    private async emergencyDrop(message: string): Promise<void> {
        this.logger.error(`CRITICAL [bot ${this.bot.id}] - ${message} - ${this.bot.state}`);

        this.bot.errorOnState = this.bot.state;
        this.bot.state = EState.ERROR_EMERGENCY_STOP;
    }

    private async saveBot(): Promise<void> {
        await this.botRepo.save(this.bot);
    }
}
