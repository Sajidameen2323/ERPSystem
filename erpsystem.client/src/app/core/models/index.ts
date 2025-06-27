// Core result types for API responses
export interface Result<T = any> {
  isSuccess: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Dashboard models
export * from './dashboard.model';

// Authentication models
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  roles: string[];
  createdAt: Date;
  lastLoginAt?: Date;
}

// User management models
export interface UserManagement {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  roles: string[];
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface RoleAssignmentRequest {
  userId: string;
  roles: string[];
}

export interface DeactivateUserRequest {
  userId: string;
  reason?: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Pagination models
export interface PaginationParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// Common enums
export enum UserRole {
  Admin = 'Admin',
  Manager = 'Manager',
  Employee = 'Employee'
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc'
}
