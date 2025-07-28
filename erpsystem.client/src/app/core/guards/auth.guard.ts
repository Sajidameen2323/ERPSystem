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


      if (!authState.isAuthenticated) {


        // Store the route the user was trying to access
        redirectService.storeIntendedRoute(state.url);

        // Verify storage
        const storedRoute = redirectService.getIntendedRoute();


        // Redirect to login
        redirectService.storeCurrentRouteAndRedirectToLogin();
        return false;
      }

      return true;
    })
  );
};
