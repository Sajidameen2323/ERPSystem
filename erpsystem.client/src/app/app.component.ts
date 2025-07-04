import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OKTA_AUTH, OktaAuthStateService } from '@okta/okta-angular';
import { AuthState } from '@okta/okta-auth-js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'MicroBiz Hub ERP';
  isLoading = true;
  initializationError: string | null = null;

  private oktaAuth = inject(OKTA_AUTH);
  private oktaAuthStateService = inject(OktaAuthStateService);
  private router = inject(Router);

  async ngOnInit() {
    try {
      console.log('🚀 App initializing...');
      
      // Subscribe to auth state changes
      this.oktaAuthStateService.authState$.subscribe((authState: AuthState) => {
        console.log('📊 Auth state changed:', authState);
        
        if (authState.isAuthenticated) {
          console.log('✅ User is authenticated');
          // User is authenticated, redirect to dashboard if on login page
          if (this.router.url === '/login' || this.router.url === '/' || this.router.url === '/unauthorized') {
            console.log('🔄 Redirecting authenticated user to dashboard');
            this.router.navigate(['/dashboard']);
          }
        } else {
          console.log('❌ User is not authenticated');
          // User is not authenticated, redirect to login if on protected route
          if (!this.isPublicRoute(this.router.url)) {
            console.log('🔄 Redirecting unauthenticated user to login');
            this.router.navigate(['/login']);
          }
        }
        
        this.isLoading = false;
      });

      // Start the authentication process
      await this.oktaAuth.start();
      console.log('✅ Okta Auth started successfully');

    } catch (error) {
      console.error('❌ Error during app initialization:', error);
      this.initializationError = 'Failed to initialize authentication';
      this.isLoading = false;
    }
  }

  private isPublicRoute(url: string): boolean {
    const publicRoutes = ['/login', '/unauthorized', '/login/callback'];
    return publicRoutes.some(route => url.startsWith(route)) || url === '/';
  }
}
