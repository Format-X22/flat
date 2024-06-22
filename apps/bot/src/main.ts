import { NestFactory } from '@nestjs/core';
import { BotModule } from './bot.module';
import { LoaderService } from './loader/loader.service';
import { AnalyzerService } from './analyzer/analyzer.service';
import { config } from './bot.config';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(BotModule);

    await app.init();

    if (!config.botMode) {
        const loaderService = app.get(LoaderService);
        const calculatorService = app.get(AnalyzerService);

        if (config.load) {
            await loaderService.loadActual();
        }

        await calculatorService.calc({
            risk: config.risk,
            from: config.from,
            to: config.to,
        });

        await app.close();
    }
}
bootstrap();
