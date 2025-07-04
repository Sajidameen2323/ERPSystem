// Result interfaces matching ERPSystem.Server.Common.Result
// Uses camelCase property names for Angular but maps to server's PascalCase via HTTP interceptor
export interface Result<T = void> {
  isSuccess: boolean;
  error: string;
  data?: T;
  message?: string; // Optional for frontend compatibility, can be derived from error
}

// PagedResult interface matching ERPSystem.Server.Common.PagedResult<T>
// Uses camelCase property names for Angular but maps to server's PascalCase via HTTP interceptor
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ApiResponse interface matching ERPSystem.Server.DTOs.Shared.ApiResponse<T>
export interface ApiResponse<T = any> {
  isSuccess: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string; // ISO string from DateTime
}

// PagedApiResponse interface matching ERPSystem.Server.DTOs.Shared.PagedApiResponse<T>
export interface PagedApiResponse<T> extends ApiResponse<T> {
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// PaginationRequest interface matching ERPSystem.Server.DTOs.Shared.PaginationRequest
export interface PaginationRequest {
  page: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean; // Made optional for frontend convenience
}
