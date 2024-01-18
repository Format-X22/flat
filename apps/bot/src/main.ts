import { NestFactory } from '@nestjs/core';
import { BotModule } from './bot.module';
import { LoaderService } from './analyzer/loader/loader.service';
import { CalculatorService } from './analyzer/calculator/calculator.service';
import { endOfYear, startOfYear } from './utils/time.util';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(BotModule);

    await app.get(LoaderService).loadActual();
    await app.get(CalculatorService).calc({
        risk: 33,
        from: startOfYear(2018),
        to: endOfYear(2025),
    });
}
bootstrap();
