import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';

export const UuidParamPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new BadRequestException('El id enviado no es un UUID válido'),
});
