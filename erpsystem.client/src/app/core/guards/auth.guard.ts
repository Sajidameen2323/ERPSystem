import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
};

export const adminGuard: CanActivateFn = roleGuard(['Admin']);
export const salesGuard: CanActivateFn = roleGuard(['Admin', 'SalesUser']);
export const inventoryGuard: CanActivateFn = roleGuard(['Admin', 'InventoryUser']);
export const managerGuard: CanActivateFn = roleGuard(['Admin', 'SalesUser']); // Alias for backward compatibility
export const employeeGuard: CanActivateFn = roleGuard(['Admin', 'SalesUser', 'InventoryUser']);
