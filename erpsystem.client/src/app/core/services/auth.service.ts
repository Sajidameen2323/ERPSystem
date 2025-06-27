import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { HttpService } from './http.service';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  UserProfile, 
  ChangePasswordRequest,
  Result 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(
    private httpService: HttpService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('current_user');
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    return this.httpService.post<AuthResponse>('/auth/login', loginRequest).pipe(
      map(result => {
        console.log(result);
        if (result.isSuccess && result.data) {
          return result.data;
        }
        throw new Error(result.message || 'Login failed');
      }),
      tap(authResponse => {
        this.setAuth(authResponse);
      })
    );
  }

  register(registerRequest: RegisterRequest): Observable<AuthResponse> {
    return this.httpService.post<AuthResponse>('/auth/register', registerRequest).pipe(
      map(result => {
        if (result.isSuccess && result.data) {
          return result.data;
        }
        throw new Error(result.message || 'Registration failed');
      }),
      tap(authResponse => {
        this.setAuth(authResponse);
      })
    );
  }

  logout(): void {
    // Call logout endpoint
    this.httpService.post('/auth/logout', {}).subscribe({
      complete: () => {
        this.clearAuth();
        this.router.navigate(['/login']);
      },
      error: () => {
        // Clear auth even if logout call fails
        this.clearAuth();
        this.router.navigate(['/login']);
      }
    });
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.clearAuth();
      throw new Error('No refresh token available');
    }

    return this.httpService.post<AuthResponse>('/auth/refresh-token', { refreshToken }).pipe(
      map(result => {
        if (result.isSuccess && result.data) {
          return result.data;
        }
        throw new Error(result.message || 'Token refresh failed');
      }),
      tap(authResponse => {
        this.setAuth(authResponse);
      })
    );
  }

  changePassword(changePasswordRequest: ChangePasswordRequest): Observable<void> {
    return this.httpService.post<void>('/auth/change-password', changePasswordRequest).pipe(
      map(result => {
        if (!result.isSuccess) {
          throw new Error(result.message || 'Password change failed');
        }
      })
    );
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isLoggedInSubject.value && !!localStorage.getItem('auth_token');
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user?.roles) return false;
    return roles.some(role => user.roles.includes(role));
  }

  private setAuth(authResponse: AuthResponse): void {
    localStorage.setItem('auth_token', authResponse.token);
    localStorage.setItem('refresh_token', authResponse.refreshToken);
    localStorage.setItem('current_user', JSON.stringify(authResponse.user));
    
    this.currentUserSubject.next(authResponse.user);
    this.isLoggedInSubject.next(true);
  }

  private clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }
}
