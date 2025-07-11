import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { 
  User, 
  RegisterUserRequest, 
  UserSearchRequest, 
  AssignRolesRequest, 
  PagedResult, 
  Result 
} from '../models/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly baseUrl = '/api/users';

  constructor(private http: HttpClient) {}

  /**
   * Get list of users (Admin only)
   * Uses the unified users endpoint that supports optional filtering
   * Backend always returns PagedResult regardless of filters
   */
  getUsers(request?: UserSearchRequest): Observable<Result<PagedResult<User>>> {
    // Use the default users endpoint - supports optional filtering
    // Backend handles filtering, AG Grid handles pagination and sorting
    const endpoint = `${this.baseUrl}`;
    let params = new HttpParams();

    // Send filter parameters when provided
    if (request?.searchTerm) {
      params = params.set('searchTerm', request.searchTerm);
    }
    if (request?.isActive !== undefined) {
      params = params.set('isActive', request.isActive.toString());
    }

    return this.http.get<Result<PagedResult<User>>>(endpoint, { params }).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          // Add computed properties to users
          const processedUsers = response.data.items.map(user => ({
            ...user,
            isActive: user.status !== 'DEPROVISIONED' && user.status !== 'SUSPENDED',
            lastLoginAt: user.lastLoginAt // Placeholder for future enhancement
          }));

          const pagedResult: PagedResult<User> = {
            ...response.data,
            items: processedUsers
          };

          return {
            isSuccess: true,
            error: '',
            data: pagedResult,
            message: undefined
          };
        } else {
          return {
            isSuccess: false,
            error: response.error || 'Failed to load users',
            data: undefined,
            message: response.error || 'Failed to load users'
          };
        }
      })
    );
  }

  /**
   * Get user by ID (Admin only)
   */
  getUserById(id: string): Observable<Result<User>> {
    return this.http.get<Result<User>>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get current user's profile
   */
  getCurrentUserProfile(): Observable<Result<User>> {
    return this.http.get<Result<User>>(`${this.baseUrl}/profile`);
  }

  /**
   * Get all available roles (Admin only)
   */
  getRoles(): Observable<Result<string[]>> {
    return this.http.get<Result<string[]>>(`${this.baseUrl}/roles`);
  }

  /**
   * Register a new user with Okta (Admin only)
   */
  registerUser(userData: RegisterUserRequest): Observable<Result<User>> {
    return this.http.post<Result<User>>('/api/auth/register', userData);
  }

  /**
   * Assign roles to user (Admin only)
   */
  assignRoles(userId: string, roles: AssignRolesRequest): Observable<Result<void>> {
    return this.http.put<Result<void>>(`${this.baseUrl}/${userId}/roles`, roles);
  }

  /**
   * Deactivate user (Admin only)
   */
  deactivateUser(userId: string): Observable<Result<void>> {
    return this.http.put<Result<void>>(`${this.baseUrl}/${userId}/deactivate`, {});
  }

  /**
   * Activate user (Admin only)
   */
  activateUser(userId: string): Observable<Result<void>> {
    return this.http.put<Result<void>>(`${this.baseUrl}/${userId}/activate`, {});
  }

  /**
   * Bulk activate users (Admin only)
   */
  bulkActivateUsers(userIds: string[]): Observable<Result<string[]>> {
    return this.http.put<Result<string[]>>(`${this.baseUrl}/bulk/activate`, userIds);
  }

  /**
   * Bulk deactivate users (Admin only)
   */
  bulkDeactivateUsers(userIds: string[]): Observable<Result<string[]>> {
    return this.http.put<Result<string[]>>(`${this.baseUrl}/bulk/deactivate`, userIds);
  }
}
