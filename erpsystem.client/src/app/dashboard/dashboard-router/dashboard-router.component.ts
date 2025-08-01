import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-router',
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
      </div>
    </div>
  `,
  imports: [CommonModule]
})
export class DashboardRouterComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  ngOnInit() {
    // Small delay to ensure auth is fully loaded
    setTimeout(() => {
      this.redirectToDashboard();
    }, 100);
  }

  private redirectToDashboard(): void {
    try {
      const userRoles = this.authService.getUserRoles();
      
      // Determine dashboard based on role hierarchy
      const dashboardRoute = this.determineDashboardRoute(userRoles);
      
      // Navigate to the appropriate dashboard
      this.router.navigate([dashboardRoute]);
    } catch (error) {
      console.error('Error in dashboard routing:', error);
      // Fallback to home dashboard on error
      this.router.navigate(['/dashboard/home']);
    }
  }

  /**
   * Determine which dashboard to show based on user roles
   * Industry standard approach: role hierarchy with multiple role support
   */
  private determineDashboardRoute(roles: string[]): string {
    if (!roles || roles.length === 0) {
      // No roles, show basic dashboard
      return '/dashboard/home';
    }

    // Check for admin role first (highest priority)
    if (roles.includes('admin')) {
      return '/dashboard/admin';
    }

    // Check for multiple business roles (show comprehensive dashboard)
    const businessRoles = roles.filter(role => 
      ['salesuser', 'inventoryuser'].includes(role)
    );

    if (businessRoles.length > 1) {
      // User has multiple business roles, show admin dashboard for full access
      return '/dashboard/admin';
    }

    // Single role routing
    if (roles.includes('salesuser')) {
      return '/dashboard/sales';
    }

    if (roles.includes('inventoryuser')) {
      return '/dashboard/inventory';
    }

    // Fallback to home dashboard
    return '/dashboard/home';
  }
}
