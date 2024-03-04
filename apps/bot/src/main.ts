import { NestFactory } from '@nestjs/core';
import { BotModule } from './bot.module';
import { LoaderService } from './analyzer/loader/loader.service';
import { CalculatorService } from './analyzer/calculator/calculator.service';
import { config } from './bot.config';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(BotModule);
    const loaderService = app.get(LoaderService);
    const calculatorService = app.get(CalculatorService);

    if (config.load) {
        await loaderService.loadActual();
    }

    await calculatorService.calc({
        risk: config.risk,
        from: config.from,
        to: config.to,
    });
}
bootstrap();
