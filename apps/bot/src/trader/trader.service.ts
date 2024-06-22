import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TraderService {
    private readonly logger: Logger = new Logger(TraderService.name);
    private capital: number;
    private started: boolean;

    async start(capital: number): Promise<void> {
        if (this.started) {
            throw 'Already started!';
        }

        this.started = true;
        this.capital = capital;

        // TODO -

        this.logger.log('Trader started!');
    }

    async stop(): Promise<void> {
        if (!this.started) {
            throw 'Already stopped.';
        }

        this.started = false;
        this.capital = null;

        // TODO -

        this.logger.log('Trader stopped.');
    }
}
