import { NestFactory } from '@nestjs/core';
import { BotModule } from './bot.module';
import { LoaderService } from './analyzer/loader/loader.service';
import { CalculatorService } from './analyzer/calculator/calculator.service';
import { BotService } from './bot.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(BotModule);

    // Init service
    app.get(BotService);

    await app.get(LoaderService).loadActual('1d');
    await app.get(CalculatorService).calc();
}
bootstrap();
