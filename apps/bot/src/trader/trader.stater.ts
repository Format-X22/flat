import { BotModel, EState, EStateSection, TFullState } from '../data/bot.model';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { sleep } from '@app/shared/sleep.util';
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
                if (this.bot.state === EState.EMERGENCY_STOP) {
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

            if (this.bot.state === EState.EMERGENCY_STOP) {
                await sleep();
            } else {
                await sleep(ITERATION_TIMEOUT);
            }
        }
    }

    private async next(): Promise<void> {
        const section = this.bot.stateSection;
        const state = this.bot.state;

        switch (section) {
            case EStateSection.INITIAL:
                switch (state) {
                    case EState.INITIAL:
                        await this.onInitialInitial();
                        break;
                    case EState.DEACTIVATED:
                        await this.onInitialDeactivated();
                        break;
                    default:
                        await this.emergencyDrop('Invalid bot state');
                        break;
                }
                break;
            case EStateSection.ERROR:
                switch (state) {
                    case EState.ERROR:
                        await this.onErrorError();
                        break;

                    case EState.EMERGENCY_STOP:
                        await this.onErrorEmergencyStop();
                        break;
                    default:
                        await this.emergencyDrop('Invalid bot state');
                        break;
                }
                break;
            case EStateSection.WORKING:
                switch (state) {
                    case EState.WAITING:
                        await this.onWorkingWaiting();
                        break;
                    case EState.CHECK_POSITION_COLLISION:
                        await this.onWorkingCheckPositionCollision();
                        break;
                    case EState.CHECK_BALANCE_CHANGE:
                        await this.onWorkingCheckBalanceChange();
                        break;
                    case EState.CHECK_PAYMENT_REQUIRES:
                        await this.onWorkingCheckPaymentRequires();
                        break;
                    default:
                        await this.emergencyDrop('Invalid bot state');
                        break;
                }
                break;
            case EStateSection.HANDLE_CANDLE:
                switch (state) {
                    case EState.CHECK_ANALYTICS:
                        await this.onHandleCandleCheckAnalytics();
                        break;
                    case EState.CHECK_POSITION_WRONG_EXISTS:
                        await this.onHandleCandleCheckPositionWrongExists();
                        break;
                    case EState.CANCEL_UP_ORDER:
                        await this.onHandleCandleCancelUpOrder();
                        break;
                    case EState.CANCEL_DOWN_ORDER:
                        await this.onHandleCandleCancelDownOrder();
                        break;
                    case EState.PLACE_UP_ORDER:
                        await this.onHandleCandlePlaceOpOrder();
                        break;
                    case EState.PLACE_DOWN_ORDER:
                        await this.onHandleCandlePlaceDownOrder();
                        break;
                    case EState.REPLACE_STOP:
                        await this.onHandleCandleReplaceStop();
                        break;
                    default:
                        await this.emergencyDrop('Invalid bot state');
                        break;
                }
                break;
            default:
                await this.emergencyDrop('Invalid bot state _section_');
                break;
        }
    }

    private async onInitialInitial(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.stateSection = EStateSection.INITIAL;
            this.bot.state = EState.DEACTIVATED;
            return;
        }

        this.bot.stateSection = EStateSection.WORKING;
        this.bot.state = EState.WAITING;
    }

    private async onInitialDeactivated(): Promise<void> {
        if (this.bot.isActive) {
            this.bot.stateSection = EStateSection.INITIAL;
            this.bot.state = EState.INITIAL;
            return;
        }
    }

    private async onErrorError(): Promise<void> {
        if (this.bot.isActive) {
            this.bot.stateSection = EStateSection.INITIAL;
            this.bot.state = EState.INITIAL;
            return;
        }
    }

    private async onErrorEmergencyStop(): Promise<void> {
        // TODO -

        this.bot.isActive = false;
        this.bot.stateSection = EStateSection.ERROR;
        this.bot.state = EState.ERROR;
    }

    private async onWorkingWaiting(): Promise<void> {
        if (!this.bot.isActive) {
            // TODO cancel all
            this.bot.stateSection = EStateSection.INITIAL;
            this.bot.state = EState.DEACTIVATED;
            return;
        }

        // TODO Check time to handle candle
        // lastHandledCandle

        // TODO -

        this.bot.state = EState.CHECK_POSITION_COLLISION;
    }

    private async onWorkingCheckPositionCollision(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.stateSection = EStateSection.WORKING;
            this.bot.state = EState.WAITING;
            return;
        }

        // TODO -

        this.bot.state = EState.CHECK_BALANCE_CHANGE;
    }

    private async onWorkingCheckBalanceChange(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.stateSection = EStateSection.WORKING;
            this.bot.state = EState.WAITING;
            return;
        }

        // TODO -

        this.bot.state = EState.CHECK_PAYMENT_REQUIRES;
    }

    private async onWorkingCheckPaymentRequires(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.stateSection = EStateSection.WORKING;
            this.bot.state = EState.WAITING;
            return;
        }

        // TODO -

        this.bot.state = EState.WAITING;
    }

    private async onHandleCandleCheckAnalytics(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.stateSection = EStateSection.WORKING;
            this.bot.state = EState.WAITING;
            return;
        }

        // TODO -

        this.bot.state = EState.CHECK_POSITION_WRONG_EXISTS;
    }

    private async onHandleCandleCheckPositionWrongExists(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.stateSection = EStateSection.WORKING;
            this.bot.state = EState.WAITING;
            return;
        }

        // TODO -

        this.bot.state = EState.CANCEL_UP_ORDER;
    }

    private async onHandleCandleCancelUpOrder(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.stateSection = EStateSection.WORKING;
            this.bot.state = EState.WAITING;
            return;
        }

        // Do not cancel if no changes
        // Edit only size if size changes
        // For save position in glass
        // TODO -

        this.bot.state = EState.CANCEL_DOWN_ORDER;
    }

    private async onHandleCandleCancelDownOrder(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.stateSection = EStateSection.WORKING;
            this.bot.state = EState.WAITING;
            return;
        }

        // TODO -

        this.bot.state = EState.PLACE_UP_ORDER;
    }

    private async onHandleCandlePlaceOpOrder(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.stateSection = EStateSection.WORKING;
            this.bot.state = EState.WAITING;
            return;
        }

        // TODO -

        this.bot.state = EState.PLACE_DOWN_ORDER;
    }

    private async onHandleCandlePlaceDownOrder(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.stateSection = EStateSection.WORKING;
            this.bot.state = EState.WAITING;
            return;
        }

        // TODO -

        this.bot.state = EState.REPLACE_STOP;
    }

    private async onHandleCandleReplaceStop(): Promise<void> {
        if (!this.bot.isActive) {
            this.bot.stateSection = EStateSection.WORKING;
            this.bot.state = EState.WAITING;
            return;
        }

        // TODO -

        this.bot.stateSection = EStateSection.WORKING;
        this.bot.state = EState.WAITING;
    }

    private async emergencyDrop(message: string): Promise<void> {
        const currentFullState: TFullState = `${this.bot.stateSection}__${this.bot.state}`;

        this.logger.error(`CRITICAL [bot ${this.bot.id}] - ${message} - ${currentFullState}`);

        this.bot.errorOnState = currentFullState;
        this.bot.stateSection = EStateSection.ERROR;
        this.bot.state = EState.EMERGENCY_STOP;
    }

    private async saveBot(): Promise<void> {
        await this.botRepo.save(this.bot);
    }
}
