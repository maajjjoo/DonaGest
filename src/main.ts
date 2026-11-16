import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(
    `DonaGest API corriendo en: http://localhost:${port}/api`,
    'Bootstrap',
  );
}
void bootstrap();
