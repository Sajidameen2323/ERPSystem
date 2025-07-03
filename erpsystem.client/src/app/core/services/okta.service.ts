import { Injectable, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { OKTA_AUTH, OktaAuthStateService } from '@okta/okta-angular';
import { OktaAuth, AuthState } from '@okta/okta-auth-js';
import { UserProfile } from '../models';

@Injectable({
  providedIn: 'root'
})
export class OktaService {
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    @Inject(OKTA_AUTH) private oktaAuth: OktaAuth,
    private oktaAuthStateService: OktaAuthStateService,
    private router: Router
  ) {
    // Subscribe to auth state changes
    this.oktaAuthStateService.authState$.subscribe(async (authState: AuthState) => {
      if (authState?.isAuthenticated && authState.accessToken) {
        // Get user info and convert to our UserProfile format
        const oktaUser = await this.oktaAuth.getUser();
        const userProfile: UserProfile = {
          id: oktaUser.sub || '',
          firstName: oktaUser.given_name || '',
          lastName: oktaUser.family_name || '',
          email: oktaUser.email || '',
          phoneNumber: typeof oktaUser['phone_number'] === 'string' ? oktaUser['phone_number'] : undefined,
          isActive: true,
          roles: Array.isArray(oktaUser['groups']) ? 
            oktaUser['groups'].map(group => String(group)) : [],
          createdAt: new Date(),
          lastLoginAt: new Date()
        };
        
        this.currentUserSubject.next(userProfile);
        
        // Store for compatibility with existing code
        localStorage.setItem('okta_access_token', authState.accessToken.accessToken);
        localStorage.setItem('current_user', JSON.stringify(userProfile));
      } else {
        this.currentUserSubject.next(null);
        this.clearLocalStorage();
      }
    });
  }

  // Sign in with redirect
  async signInWithRedirect(originalUri?: string): Promise<void> {
    await this.oktaAuth.signInWithRedirect({
      originalUri: originalUri || '/dashboard'
    });
  }

  // Handle the login redirect callback
  async handleLoginRedirect(): Promise<void> {
    await this.oktaAuth.handleLoginRedirect();
  }

  // Sign out
  async signOut(): Promise<void> {
    await this.oktaAuth.signOut();
    this.clearLocalStorage();
  }

  // Get access token
  getAccessToken(): string | undefined {
    return this.oktaAuth.getAccessToken();
  }

  // Check if user is authenticated
  isAuthenticated(): Observable<boolean> {
    return this.oktaAuthStateService.authState$.pipe(
      map(authState => !!authState?.isAuthenticated)
    );
  }

  // Get current user
  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  // Check if user has specific roles
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user?.roles) return false;
    return roles.some(role => user.roles.includes(role));
  }

  // Get user claims
  async getUserClaims(): Promise<any> {
    return await this.oktaAuth.getUser();
  }

  // Clear local storage
  private clearLocalStorage(): void {
    localStorage.removeItem('okta_access_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('okta_return_url');
  }
}
