import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OKTA_AUTH, OktaAuthStateService } from '@okta/okta-angular';
import { AuthState } from '@okta/okta-auth-js';
import { GlobalLoadingComponent } from './shared/global-loading/global-loading.component';
import { GlobalLoadingService } from './core/services/global-loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, GlobalLoadingComponent],
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
  private globalLoadingService = inject(GlobalLoadingService);

  async ngOnInit() {
    try {
      // Subscribe to auth state changes
      this.oktaAuthStateService.authState$.subscribe((authState: AuthState) => {
        if (authState.isAuthenticated) {
          // User is authenticated, redirect to dashboard if on login page
          if (this.router.url === '/login' || this.router.url === '/' || this.router.url === '/unauthorized') {
            this.router.navigate(['/dashboard']);
          }
        } else {
          // User is not authenticated, redirect to login if on protected route
          if (!this.isPublicRoute(this.router.url)) {
            this.router.navigate(['/login']);
          }
        }
        
        this.isLoading = false;
      });

      // Start the authentication process
      await this.oktaAuth.start();

    } catch (error) {
      console.error('Error during app initialization:', error);
      this.initializationError = 'Failed to initialize authentication';
      this.isLoading = false;
    }
  }

  private isPublicRoute(url: string): boolean {
    const publicRoutes = ['/login', '/unauthorized', '/login/callback'];
    return publicRoutes.some(route => url.startsWith(route)) || url === '/';
  }
}
