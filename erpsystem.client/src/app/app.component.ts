import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OKTA_AUTH, OktaAuthStateService } from '@okta/okta-angular';
import { AuthState } from '@okta/okta-auth-js';
import { GlobalLoadingComponent } from './shared/global-loading/global-loading.component';
import { GlobalLoadingService } from './core/services/global-loading.service';
import { RedirectService } from './core/services/redirect.service';

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
  private redirectService = inject(RedirectService);

  async ngOnInit() {
    try {
      // Debug session storage functionality
      this.redirectService.debugSessionStorage();
      
      // Store current route if user is trying to access protected route on initial load
      const currentUrl = this.router.url;
      console.log('🚀 AppComponent: Initializing with URL:', currentUrl);
      
      if (!this.isPublicRoute(currentUrl)) {
        console.log('📂 AppComponent: Storing intended route on app init:', currentUrl);
        this.redirectService.storeIntendedRoute(currentUrl);
        
        // Verify storage immediately
        const storedRoute = this.redirectService.getIntendedRoute();
        console.log('🔍 AppComponent: Verification - stored route:', storedRoute);
      }

      // Subscribe to auth state changes
      this.oktaAuthStateService.authState$.subscribe((authState: AuthState) => {
        console.log('🔐 AppComponent: Auth state changed:', authState.isAuthenticated);
        console.log('📍 AppComponent: Current URL during auth change:', this.router.url);
        
        if (authState.isAuthenticated) {
          // User is authenticated
          const routerUrl = this.router.url;
          
          // If user is on login/unauthorized pages, navigate to intended route
          if (this.isPublicRoute(routerUrl)) {
            console.log('✅ AppComponent: User authenticated, navigating from public route');
            this.redirectService.navigateToIntendedRoute('/dashboard');
          }
        } else {
          // User is not authenticated
          const routerUrl = this.router.url;
          
          if (!this.isPublicRoute(routerUrl)) {
            console.log('🚫 AppComponent: User not authenticated, storing route and redirecting to login');
            console.log('📍 AppComponent: Route being stored:', routerUrl);
            this.redirectService.storeCurrentRouteAndRedirectToLogin();
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
