import { NestFactory } from '@nestjs/core';
import { BotModule } from './bot.module';
import { ConfigService } from '@nestjs/config';
import { LoaderService } from './analyzer/loader/loader.service';
import { CalculatorService } from './analyzer/calculator/calculator.service';
import { BotService } from './bot.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(BotModule);
    const config = app.get(ConfigService);

    // TODO -

    // Init service
    app.get(BotService);

    //await app.get(LoaderService).truncate();
    //await app.get(LoaderService).load('1d');
    await app.get(CalculatorService).calc();
}
bootstrap();
