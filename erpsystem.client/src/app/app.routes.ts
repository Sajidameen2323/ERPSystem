import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard, managerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Redirect root to dashboard
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  
  // Authentication routes (only for guests)
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'login/okta',
    loadComponent: () => import('./auth/okta-login/okta-login.component').then(m => m.OktaLoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'login/callback',
    loadComponent: () => import('./auth/okta-callback/okta-callback.component').then(m => m.OktaCallbackComponent)
  },

  
  // Dashboard route (requires authentication)
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  
  // User management routes
  {
    path: 'users',
    loadComponent: () => import('./components/user-management/user-list/user-list.component').then(m => m.UserListComponent),
    canActivate: [managerGuard]
  },
  {
    path: 'users/add',
    loadComponent: () => import('./components/user-management/user-add/user-add.component').then(m => m.UserAddComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'users/edit/:id',
    loadComponent: () => import('./components/user-management/user-edit/user-edit.component').then(m => m.UserEditComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/user-management/user-profile/user-profile.component').then(m => m.UserProfileComponent),
    canActivate: [authGuard]
  },
  
  // Error pages
  {
    path: 'unauthorized',
    loadComponent: () => import('./components/shared/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: 'not-found',
    loadComponent: () => import('./components/shared/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  
  // Wildcard route - must be last
  { path: '**', redirectTo: '/not-found' }
];
