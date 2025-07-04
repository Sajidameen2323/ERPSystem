import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { OktaAuthStateService } from '@okta/okta-angular';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

/**
 * Guest Guard - Allows access only when user is not authenticated
 * Redirects authenticated users to dashboard
 */
export const guestGuard = (): Observable<boolean> => {
  const oktaAuthStateService = inject(OktaAuthStateService);
  const router = inject(Router);

  return oktaAuthStateService.authState$.pipe(
    take(1),
    map(authState => {
      if (authState.isAuthenticated) {
        // User is authenticated, redirect to dashboard
        console.log('User is already authenticated, redirecting to dashboard');
        router.navigate(['/dashboard']);
        return false;
      }
      // User is not authenticated, allow access to login
      return true;
    })
  );
};
