import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { API_PREFIX, configureApp } from './app.setup';
import { APP_VERSION } from './common/constants/app.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DonaGest API')
    .setDescription(
      'API para gestionar donaciones humanitarias dirigidas a comunidades colombianas afectadas por emergencias.',
    )
    .setVersion(APP_VERSION)
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = app.get(ConfigService).get<number>('PORT') ?? 3000;
  await app.listen(port);
  Logger.log(
    `DonaGest API corriendo en: http://localhost:${port}/${API_PREFIX}`,
    'Bootstrap',
  );
  Logger.log(
    `Documentación en: http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}
void bootstrap();
