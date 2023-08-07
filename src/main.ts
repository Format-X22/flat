import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // TODO -
}
bootstrap().catch((error) => console.log('FATAL on start - ' + error));
