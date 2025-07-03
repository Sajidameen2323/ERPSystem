import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { OktaAuthStateService } from '@okta/okta-angular';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const oktaAuthStateService = inject(OktaAuthStateService);
  const router = inject(Router);

  return oktaAuthStateService.authState$.pipe(
    take(1),
    map((authState) => {
      if (authState?.isAuthenticated) {
        return true;
      }
      
      router.navigate(['/login/okta'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};

export const guestGuard: CanActivateFn = (route, state) => {
  const oktaAuthStateService = inject(OktaAuthStateService);
  const router = inject(Router);

  return oktaAuthStateService.authState$.pipe(
    take(1),
    map((authState) => {
      if (!authState?.isAuthenticated) {
        return true;
      }
      
      router.navigate(['/dashboard']);
      return false;
    })
  );
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const oktaAuthStateService = inject(OktaAuthStateService);
    const authService = inject(AuthService);
    const router = inject(Router);

    return oktaAuthStateService.authState$.pipe(
      take(1),
      map((authState) => {
        if (!authState?.isAuthenticated) {
          router.navigate(['/login/okta'], { queryParams: { returnUrl: state.url } });
          return false;
        }

        if (authService.hasAnyRole(allowedRoles)) {
          return true;
        }

        router.navigate(['/unauthorized']);
        return false;
      })
    );
  };
};

export const adminGuard: CanActivateFn = roleGuard(['Admin']);
export const salesGuard: CanActivateFn = roleGuard(['Admin', 'SalesUser']);
export const inventoryGuard: CanActivateFn = roleGuard(['Admin', 'InventoryUser']);
export const managerGuard: CanActivateFn = roleGuard(['Admin', 'SalesUser']); // Alias for backward compatibility
export const employeeGuard: CanActivateFn = roleGuard(['Admin', 'SalesUser', 'InventoryUser']);
