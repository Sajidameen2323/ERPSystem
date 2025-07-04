import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, catchError, of } from 'rxjs';
import { OKTA_AUTH } from '@okta/okta-angular';
import { 
  TokenValidationRequest, 
  TokenValidationResponse, 
  AuthResponse, 
  User, 
  Result 
} from '../models/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = '/api/auth';
  private oktaAuth = inject(OKTA_AUTH);

  constructor(private http: HttpClient) {}

  /**
   * Check if user has valid authentication
   */
  isAuthenticated(): Observable<boolean> {
    return from(this.oktaAuth.isAuthenticated()).pipe(
      catchError(() => of(false))
    );
  }

  /**
   * Get access token if available
   */
  getAccessToken(): Observable<string | null> {
    return from(Promise.resolve(this.oktaAuth.getAccessToken())).pipe(
      map(token => token || null),
      catchError(() => of(null))
    );
  }

  /**
   * Initialize authentication and check for existing session
   */
  initializeAuth(): Observable<boolean> {
    return from(this.oktaAuth.start()).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Failed to initialize authentication:', error);
        return of(false);
      })
    );
  }

  /**
   * Validate access token with server
   */
  validateToken(request: TokenValidationRequest): Observable<TokenValidationResponse> {
    return this.http.post<TokenValidationResponse>(`${this.baseUrl}/validate-token`, request);
  }

  /**
   * Get current user profile from authenticated token
   */
  getCurrentUserProfile(): Observable<Result<User>> {
    return this.http.get<Result<User>>(`${this.baseUrl}/profile`);
  }

  /**
   * Logout current user
   */
  logout(): Observable<Result<void>> {
    return this.http.post<Result<void>>(`${this.baseUrl}/logout`, {});
  }

  /**
   * Sign out from Okta and clear session
   */
  signOut(): Observable<void> {
    return from(this.oktaAuth.signOut()).pipe(
      map(() => void 0),
      catchError((error) => {
        console.error('Error during sign out:', error);
        return of(void 0);
      })
    );
  }
}
