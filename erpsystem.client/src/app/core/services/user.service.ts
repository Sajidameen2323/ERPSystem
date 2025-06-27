import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpService } from './http.service';
import { 
  UserManagement,
  UserProfile,
  PagedResult,
  PaginationParams,
  RoleAssignmentRequest,
  DeactivateUserRequest,
  UpdateProfileRequest,
  Result
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private httpService: HttpService) {}

  // Get paginated list of users
  getUsers(pagination: PaginationParams): Observable<PagedResult<UserManagement>> {
    return this.httpService.getPaged<UserManagement>('/users', pagination).pipe(
      map(result => {
        if (result.isSuccess && result.data) {
          return result.data;
        }
        throw new Error(result.message || 'Failed to fetch users');
      })
    );
  }

  // Get user by ID
  getUserById(id: string): Observable<UserManagement> {
    return this.httpService.get<UserManagement>(`/users/${id}`).pipe(
      map(result => {
        if (result.isSuccess && result.data) {
          return result.data;
        }
        throw new Error(result.message || 'Failed to fetch user');
      })
    );
  }

  // Get current user profile
  getProfile(): Observable<UserProfile> {
    return this.httpService.get<UserProfile>('/users/profile').pipe(
      map(result => {
        if (result.isSuccess && result.data) {
          return result.data;
        }
        throw new Error(result.message || 'Failed to fetch profile');
      })
    );
  }

  // Update user profile
  updateProfile(updateRequest: UpdateProfileRequest): Observable<UserProfile> {
    return this.httpService.put<UserProfile>('/users/profile', updateRequest).pipe(
      map(result => {
        if (result.isSuccess && result.data) {
          return result.data;
        }
        throw new Error(result.message || 'Failed to update profile');
      })
    );
  }

  // Assign roles to user
  assignRoles(request: RoleAssignmentRequest): Observable<void> {
    return this.httpService.put<void>(`/users/${request.userId}/roles`, { roles: request.roles }).pipe(
      map(result => {
        if (!result.isSuccess) {
          throw new Error(result.message || 'Failed to assign roles');
        }
      })
    );
  }

  // Deactivate user
  deactivateUser(request: DeactivateUserRequest): Observable<void> {
    return this.httpService.put<void>(`/users/${request.userId}/deactivate`, request).pipe(
      map(result => {
        if (!result.isSuccess) {
          throw new Error(result.message || 'Failed to deactivate user');
        }
      })
    );
  }

  // Activate user
  activateUser(userId: string): Observable<void> {
    return this.httpService.put<void>(`/users/${userId}/activate`, {}).pipe(
      map(result => {
        if (!result.isSuccess) {
          throw new Error(result.message || 'Failed to activate user');
        }
      })
    );
  }

  // Get all available roles
  getRoles(): Observable<string[]> {
    return this.httpService.get<string[]>('/users/roles').pipe(
      map(result => {
        if (result.isSuccess && result.data) {
          return result.data;
        }
        throw new Error(result.message || 'Failed to fetch roles');
      })
    );
  }

  // Search users
  searchUsers(searchTerm: string, page: number = 1, pageSize: number = 10): Observable<PagedResult<UserManagement>> {
    const pagination: PaginationParams = {
      page,
      pageSize,
      searchTerm,
      sortBy: 'firstName',
      sortDirection: 'asc'
    };
    return this.getUsers(pagination);
  }
}
