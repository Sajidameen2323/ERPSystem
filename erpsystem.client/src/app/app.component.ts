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
      
      // Store current route if user is trying to access protected route on initial load
      const currentUrl = this.router.url;
      
      if (!this.isPublicRoute(currentUrl)) {
        this.redirectService.storeIntendedRoute(currentUrl);
        
        // Verify storage immediately
        const storedRoute = this.redirectService.getIntendedRoute();
      }

      // Subscribe to auth state changes
      this.oktaAuthStateService.authState$.subscribe((authState: AuthState) => {
  
        
        if (authState.isAuthenticated) {
          // User is authenticated
          const routerUrl = this.router.url;
          
          // If user is on login/unauthorized pages, navigate to intended route
          if (this.isPublicRoute(routerUrl)) {
            this.redirectService.navigateToIntendedRoute('/dashboard');
          }
        } else {
          // User is not authenticated
          const routerUrl = this.router.url;
          
          if (!this.isPublicRoute(routerUrl)) {

            this.redirectService.storeCurrentRouteAndRedirectToLogin();
          }
        }
        
        this.isLoading = false;
      });

      // Start the authentication process
      await this.oktaAuth.start();

    } catch (error) {
      this.initializationError = 'Failed to initialize authentication';
      this.isLoading = false;
    }
  }

  private isPublicRoute(url: string): boolean {
    const publicRoutes = ['/login', '/unauthorized', '/login/callback'];
    return publicRoutes.some(route => url.startsWith(route)) || url === '/';
  }
}
