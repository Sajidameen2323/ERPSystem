import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap, catchError, throwError } from 'rxjs';
import { HttpService } from './http.service';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  UserProfile, 
  ChangePasswordRequest,
  Result,
  OktaLoginResponse,
  OktaTokenValidationRequest,
  OktaTokenExchangeRequest
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
    const token = localStorage.getItem('okta_access_token');
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

  // Okta authentication methods
  validateOktaToken(accessToken: string): Observable<OktaLoginResponse> {
    const request: OktaTokenValidationRequest = { accessToken };
    return this.httpService.post<OktaLoginResponse>('/auth/okta-login', request).pipe(
      map(result => {
        if (result.isSuccess && result.data) {
          return result.data;
        }
        throw new Error(result.message || 'Okta token validation failed');
      }),
      tap(oktaResponse => {
        this.setOktaAuth(oktaResponse);
      }),
      catchError(error => {
        console.error('Okta token validation error:', error);
        return throwError(() => error);
      })
    );
  }

  // Exchange authorization code for access token using PKCE
  exchangeCodeForTokens(request: OktaTokenExchangeRequest): Observable<OktaLoginResponse> {
    return this.httpService.post<OktaLoginResponse>('/auth/okta-token-exchange', request).pipe(
      map(result => {
        if (result.isSuccess && result.data) {
          return result.data;
        }
        throw new Error(result.message || 'Token exchange failed');
      }),
      tap(oktaResponse => {
        this.setOktaAuth(oktaResponse);
      }),
      catchError(error => {
        console.error('Token exchange error:', error);
        return throwError(() => error);
      })
    );
  }

  // Legacy login method (for backward compatibility)
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

  getCurrentUserProfile(): Observable<UserProfile> {
    return this.httpService.get<UserProfile>('/auth/profile').pipe(
      map(result => {
        if (result.isSuccess && result.data) {
          return result.data;
        }
        throw new Error(result.message || 'Failed to get user profile');
      }),
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('current_user', JSON.stringify(user));
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
    return this.isLoggedInSubject.value && !!localStorage.getItem('okta_access_token');
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

  // Okta-specific methods
  getOktaAccessToken(): string | null {
    return localStorage.getItem('okta_access_token');
  }

  getOktaIdToken(): string | null {
    return localStorage.getItem('okta_id_token');
  }

  getOktaGroups(): string[] {
    const groupsJson = localStorage.getItem('okta_groups');
    if (groupsJson) {
      try {
        return JSON.parse(groupsJson);
      } catch {
        return [];
      }
    }
    return [];
  }

  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    
    const expirationTime = new Date(expiresAt);
    const now = new Date();
    return now >= expirationTime;
  }

  private setAuth(authResponse: AuthResponse): void {
    localStorage.setItem('auth_token', authResponse.token);
    localStorage.setItem('refresh_token', authResponse.refreshToken);
    localStorage.setItem('current_user', JSON.stringify(authResponse.user));
    
    this.currentUserSubject.next(authResponse.user);
    this.isLoggedInSubject.next(true);
  }

  private setOktaAuth(oktaResponse: OktaLoginResponse): void {
    localStorage.setItem('okta_access_token', oktaResponse.accessToken);
    localStorage.setItem('okta_id_token', oktaResponse.idToken);
    localStorage.setItem('current_user', JSON.stringify(oktaResponse.user));
    localStorage.setItem('okta_groups', JSON.stringify(oktaResponse.groups));
    localStorage.setItem('token_expires_at', oktaResponse.expiresAt.toString());
    
    this.currentUserSubject.next(oktaResponse.user);
    this.isLoggedInSubject.next(true);
  }

  clearAuth(): void {
    // Clear legacy tokens
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    
    // Clear Okta tokens
    localStorage.removeItem('okta_access_token');
    localStorage.removeItem('okta_id_token');
    localStorage.removeItem('okta_groups');
    localStorage.removeItem('token_expires_at');
    
    // Clear user data
    localStorage.removeItem('current_user');
    
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }
}
