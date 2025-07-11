import { Result, PagedResult, PaginationRequest } from './shared.interface';

// User interface matching ERPSystem.Server.DTOs.Auth.UserViewModel exactly
// Uses camelCase property names for Angular but maps to server's PascalCase via HTTP interceptor
export interface User {
  id: string;
  status: string;
  created: string; // ISO date string (DateTime serialized)
  firstName: string;
  lastName: string;
  email: string;
  roles?: string[]; // string[] in C# becomes string[] in TypeScript
  
  // Computed properties for frontend convenience (derived from server data)
  isActive: boolean; // computed from status !== 'DEPROVISIONED' && status !== 'SUSPENDED'
  lastLoginAt?: string; // placeholder for future enhancement
}

// RegisterUserRequest interface matching ERPSystem.Server.DTOs.Auth.RegisterUserDto
export interface RegisterUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string; // Frontend validation only, not sent to server
  roles?: string[];
  groupIds?: string[];
}

// UserSearchRequest for filtering (pagination handled by AG Grid)
export interface UserSearchRequest {
  searchTerm?: string;
  isActive?: boolean;
}

// AssignRolesRequest interface
export interface AssignRolesRequest {
  roles: string[];
}

// TokenValidationRequest matching server-side
export interface TokenValidationRequest {
  accessToken: string;
}

// TokenValidationResponse matching server-side
export interface TokenValidationResponse {
  isValid: boolean;
  user?: User;
  error?: string;
}

// AuthResponse matching server-side
export interface AuthResponse {
  isSuccess: boolean;
  message: string;
  user?: User;
  error?: string;
}

// Re-export shared interfaces for convenience
export type { Result, PagedResult, PaginationRequest };
