import { PaginatedResponse } from '../interfaces/paginated-response.interface';

export const buildPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> => ({
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  },
});

export const getSkip = (page: number, limit: number): number =>
  (page - 1) * limit;
