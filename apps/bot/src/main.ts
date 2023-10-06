import { NestFactory } from '@nestjs/core';
import { BotModule } from './bot.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoaderService } from './analyzer/loader/loader.service';
import { CalculatorService } from './analyzer/calculator/calculator.service';
import { BotService } from './bot.service';

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

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Pavlov Finance API')
        .setVersion('1.0')
        .addSecurity('session', {
            type: 'apiKey',
            in: 'header',
            name: 'admin-key',
        })
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api-docs', app, document);

    // Init service
    app.get(BotService);

    await app.get(LoaderService).truncate();
    await app.get(LoaderService).load('1d');
    await app.get(CalculatorService).calc();

    await app.listen(port);
}
bootstrap();
