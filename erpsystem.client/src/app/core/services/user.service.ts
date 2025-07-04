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
   * Note: Server returns a simple list, we convert it to PagedResult for UI compatibility
   */
  getUsers(request?: UserSearchRequest): Observable<Result<PagedResult<User>>> {
    let params = new HttpParams();

    // Add pagination parameters if provided
    if (request?.page) {
      params = params.set('page', request.page.toString());
    }
    if (request?.pageSize) {
      params = params.set('pageSize', request.pageSize.toString());
    }
    if (request?.searchTerm) {
      params = params.set('searchTerm', request.searchTerm);
    }
    if (request?.isActive !== undefined) {
      params = params.set('isActive', request.isActive.toString());
    }
    if (request?.sortBy) {
      params = params.set('sortBy', request.sortBy);
    }
    if (request?.sortDescending !== undefined) {
      params = params.set('sortDescending', request.sortDescending.toString());
    }

    return this.http.get<Result<User[]>>(this.baseUrl, { params }).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          // Convert User[] response to PagedResult<User> for UI compatibility
          // Add computed properties to users
          const processedUsers = response.data.map(user => ({
            ...user,
            isActive: user.status !== 'DEPROVISIONED',
            lastLoginAt: undefined // Placeholder for future enhancement
          }));

          // Create fake pagination since server doesn't support it yet
          const pageSize = request?.pageSize || 10;
          const currentPage = request?.page || 1;
          const totalCount = processedUsers.length;
          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = Math.min(startIndex + pageSize, totalCount);
          const paginatedItems = processedUsers.slice(startIndex, endIndex);

          const pagedResult: PagedResult<User> = {
            items: paginatedItems,
            totalCount,
            pageSize,
            currentPage,
            totalPages: Math.ceil(totalCount / pageSize),
            hasPreviousPage: currentPage > 1,
            hasNextPage: currentPage < Math.ceil(totalCount / pageSize)
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
}
