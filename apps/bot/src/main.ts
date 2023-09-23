import { NestFactory } from '@nestjs/core';
import { BotModule } from './bot.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoaderService } from './loader/loader.service';
import { CalculatorService } from './calculator/calculator.service';

async function bootstrap() {
    const app = await NestFactory.create(BotModule);
    const config = app.get(ConfigService);
    const port = config.get<number>('F_BOT_PORT');

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));

    const swaggerConfig = new DocumentBuilder().setTitle('Pavlov Finance API').setVersion('1.0').build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api-docs', app, document);

    await app.get(LoaderService).truncate();
    await app.get(LoaderService).load('1d');
    await app.get(CalculatorService).calc();

    await app.listen(port);
}
bootstrap();
