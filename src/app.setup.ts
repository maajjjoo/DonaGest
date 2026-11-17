import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';

export const API_PREFIX = 'api/v1';

export const configureApp = (app: INestApplication): void => {
  app.setGlobalPrefix(API_PREFIX);
  app.enableCors();
  app.useGlobalFilters(new TypeOrmExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
};
