import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { OktaAuthStateService } from '@okta/okta-angular';
import { map, take } from 'rxjs/operators';
import { RedirectService } from '../services/redirect.service';

/**
 * Custom Auth Guard that integrates with our redirect service
 * Replaces OktaAuthGuard to properly handle intended routes
 */
export const authGuard: CanActivateFn = (route, state) => {
  const oktaAuthStateService = inject(OktaAuthStateService);
  const redirectService = inject(RedirectService);

  return oktaAuthStateService.authState$.pipe(
    take(1),
    map(authState => {
      console.log('🛡️ AuthGuard: Checking auth state for route:', state.url);
      console.log('🛡️ AuthGuard: User authenticated:', authState.isAuthenticated);
      
      if (!authState.isAuthenticated) {
        console.log('🚫 AuthGuard: User not authenticated, storing route and redirecting to login');
        console.log('📍 AuthGuard: Route being stored:', state.url);
        
        // Store the route the user was trying to access
        redirectService.storeIntendedRoute(state.url);
        
        // Verify storage
        const storedRoute = redirectService.getIntendedRoute();
        console.log('🔍 AuthGuard: Verification - stored route:', storedRoute);
        
        // Redirect to login
        redirectService.storeCurrentRouteAndRedirectToLogin();
        return false;
      }
      
      console.log('✅ AuthGuard: User authenticated, allowing access to:', state.url);
      return true;
    })
  );
};
