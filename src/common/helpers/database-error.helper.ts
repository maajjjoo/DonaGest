import { QueryFailedError } from 'typeorm';

export const POSTGRES_FOREIGN_KEY_VIOLATION = '23503';

export const isForeignKeyViolation = (error: unknown): boolean =>
  error instanceof QueryFailedError &&
  (error.driverError as { code?: string } | undefined)?.code ===
    POSTGRES_FOREIGN_KEY_VIOLATION;
