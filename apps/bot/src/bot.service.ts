import { Injectable, Logger } from '@nestjs/common';
import { CalculatorService } from './analyzer/calculator/calculator.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoaderService } from './analyzer/loader/loader.service';

@Injectable()
export class BotService {
    private readonly logger: Logger = new Logger(BotService.name);

    constructor(private calculatorService: CalculatorService, private loaderService: LoaderService) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
    async exec(): Promise<void> {
        this.logger.log('Start day iteration');
        this.logger.log('Prepare data...');

        await this.loaderService.truncate();
        await this.loaderService.loadLastActual('1d');
        await this.loaderService.loadLastActual('1h');

        this.logger.log('All data loaded, extract orders');

        const actualOrders = await this.calculatorService.calc();

        this.logger.log('Orders extracted, compare and trade');

        // TODO -
        console.log(actualOrders);

        this.logger.log('Done!');
    }
}
