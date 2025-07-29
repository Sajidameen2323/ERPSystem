// Common types used across the application
export interface Result<T> {
  isSuccess: boolean;
  data: T | null;
  message?: string;
  error?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
