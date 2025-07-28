import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OktaAuthStateService, OKTA_AUTH } from '@okta/okta-angular';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { RedirectService } from '../services/redirect.service';

export interface RoleGuardData {
  requiredRoles?: string[];
  requireAll?: boolean; // If true, user must have ALL roles. If false, user needs ANY role
}

export const roleGuard: CanActivateFn = (route, state) => {
  const oktaAuthStateService = inject(OktaAuthStateService);
  const oktaAuth = inject(OKTA_AUTH);
  const router = inject(Router);
  const redirectService = inject(RedirectService);

  const requiredRoles = route.data?.['requiredRoles'] as string[] || [];
  const requireAll = route.data?.['requireAll'] as boolean || false;

  return oktaAuthStateService.authState$.pipe(
    switchMap(authState => {
      if (!authState.isAuthenticated) {
        // Note: Don't store route here as authGuard should have already done it
        redirectService.storeCurrentRouteAndRedirectToLogin();
        return of(false);
      }

      // If no roles are required, just check authentication
      if (requiredRoles.length === 0) {
        return of(true);
      }

      // Get user roles from token claims
      return getUserRoles(oktaAuth).then(userRoles => {
        const hasRequiredRoles = requireAll 
          ? requiredRoles.every(role => userRoles.includes(role))
          : requiredRoles.some(role => userRoles.includes(role));

        if (!hasRequiredRoles) {
          router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      }).catch(error => {
        console.error('❌ Error checking user roles:', error);
        // Don't store route again, just redirect to login
        router.navigate(['/login']);
        return false;
      });
    })
  );
};

// Helper function to extract roles from token claims
async function getUserRoles(oktaAuth: any): Promise<string[]> {
  try {
    // Priority: Get roles from access token (recommended for authorization)
    const accessToken = await oktaAuth.getAccessToken();
    if (accessToken) {
      const accessTokenClaims = oktaAuth.token.decode(accessToken);
      if (accessTokenClaims.payload.roles) {
        return accessTokenClaims.payload.roles;
      }
    }

    return [];
  } catch (error) {
    console.error('❌ Error extracting roles from token:', error);
    return [];
  }
}

// Specific role guards
export const adminGuard: CanActivateFn = (route, state) => {
  route.data = { ...route.data, requiredRoles: ['admin'] };
  return roleGuard(route, state);
};

export const salesUserGuard: CanActivateFn = (route, state) => {
  route.data = { ...route.data, requiredRoles: ['salesuser'] };
  return roleGuard(route, state);
};

export const inventoryUserGuard: CanActivateFn = (route, state) => {
  route.data = { ...route.data, requiredRoles: ['inventoryuser'] };
  return roleGuard(route, state);
};

export const salesOrInventoryGuard: CanActivateFn = (route, state) => {
  route.data = { ...route.data, requiredRoles: ['salesuser', 'inventoryuser'], requireAll: false };
  return roleGuard(route, state);
};

export const managerGuard: CanActivateFn = (route, state) => {
  route.data = { ...route.data, requiredRoles: ['admin', 'salesuser'], requireAll: false };
  return roleGuard(route, state);
};
