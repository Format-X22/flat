import { NestFactory } from '@nestjs/core';
import { SiteModule } from './site.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(SiteModule);
    const config = app.get(ConfigService);
    const port = config.get<number>('F_SITE_PORT');

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
    app.useStaticAssets(join(__dirname, 'public', 'static'));
    app.setBaseViewsDir(join(__dirname, 'public', 'views'));
    app.setViewEngine('pug');

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

    await app.listen(port);
}
bootstrap().catch((error) => console.log('FATAL on start - ' + error));
