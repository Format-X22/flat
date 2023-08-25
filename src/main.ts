import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { LoaderService } from './loader/loader.service';
import { CalculatorService } from './calculator/calculator.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('MAIN');

    logger.log('App started!');

    //await app.get(LoaderService).truncate();
    //await app.get(LoaderService).load('4h');
    await app.get(CalculatorService).calc();
}
bootstrap().catch((error) => console.log('FATAL on start - ' + error));
