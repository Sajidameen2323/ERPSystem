import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { OktaAuthStateService } from '@okta/okta-angular';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { RedirectService } from '../services/redirect.service';

/**
 * Guest Guard - Allows access only when user is not authenticated
 * Redirects authenticated users to their intended route or dashboard
 */
export const guestGuard = (): Observable<boolean> => {
  const oktaAuthStateService = inject(OktaAuthStateService);
  const redirectService = inject(RedirectService);

  return oktaAuthStateService.authState$.pipe(
    take(1),
    map(authState => {
      if (authState.isAuthenticated) {
        // User is authenticated, redirect to intended route or dashboard
        redirectService.navigateToIntendedRoute('/dashboard');
        return false;
      }
      // User is not authenticated, allow access to login
      return true;
    })
  );
};
