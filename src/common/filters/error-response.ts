import { HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  [extra: string]: unknown;
}

export const sendErrorResponse = (
  request: Request,
  response: Response,
  statusCode: number,
  message: string | string[],
  extra: Record<string, unknown> = {},
): void => {
  const body: ErrorResponseBody = {
    ...extra,
    statusCode,
    error: HttpStatus[statusCode]
      ? HttpStatus[statusCode]
          .toLowerCase()
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'Error',
    message,
    path: request.originalUrl ?? request.url,
    timestamp: new Date().toISOString(),
  };
  response.status(statusCode).json(body);
};
