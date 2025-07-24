export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerCreateRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface CustomerUpdateRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface CustomerQueryParameters {
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
  onlyInactive?: boolean;
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

export interface Result<T> {
  isSuccess: boolean;
  data?: T;
  error?: string;
}
