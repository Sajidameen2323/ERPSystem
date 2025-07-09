import { Routes } from '@angular/router';
import { OktaAuthGuard, OktaCallbackComponent } from '@okta/okta-angular';
import { adminGuard, salesUserGuard, inventoryUserGuard, managerGuard, roleGuard } from './core/guards/role.guard';
import { guestGuard } from './core/guards/guest.guard';
import { CurrentUserResolver } from './core/resolvers/current-user.resolver';

export const routes: Routes = [
  // Default route - redirect to login
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Login page
  { 
    path: 'login', 
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  
  // Okta callback route
  { path: 'login/callback', component: OktaCallbackComponent },
  
  // Unauthorized page
  { 
    path: 'unauthorized', 
    loadComponent: () => import('./shared/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent),
    canActivate: [guestGuard]
  },
  
  // Dashboard routes
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [OktaAuthGuard, roleGuard],
    data: { requiredRoles: ['admin', 'salesuser', 'inventoryuser'], requireAll: false },
    resolve: { currentUser: CurrentUserResolver },
    children: [
      // Default dashboard route
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
      },
      // Admin routes
      {
        path: 'admin/users',
        loadComponent: () => import('./dashboard/admin/admin-users.component').then(m => m.AdminUsersComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/register',
        loadComponent: () => import('./dashboard/admin/register-user.component').then(m => m.RegisterUserComponent),
        canActivate: [adminGuard]
      },
      // Profile route (available to all authenticated users)
      {
        path: 'profile',
        loadComponent: () => import('./dashboard/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },
  
  // Legacy route redirects
  { 
    path: 'admin', 
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  
  // Wildcard route - redirect to login
  { path: '**', redirectTo: '/login' }
];
