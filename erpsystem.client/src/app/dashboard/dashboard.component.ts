import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OktaAuthStateService, OKTA_AUTH } from '@okta/okta-angular';
import { AuthState } from '@okta/okta-auth-js';
import { inject } from '@angular/core';
import { LucideAngularModule, User, Users, Package, TrendingUp, Settings, LogOut } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private oktaAuthStateService = inject(OktaAuthStateService);
  private oktaAuth = inject(OKTA_AUTH);
  private router = inject(Router);

  // Lucide icons
  readonly icons = {
    User,
    Users,
    Package,
    TrendingUp,
    Settings,
    LogOut
  };

  authState: AuthState | null = null;
  userRoles: string[] = [];

  ngOnInit() {
    this.oktaAuthStateService.authState$.subscribe((authState) => {
      this.authState = authState;
      if (authState?.isAuthenticated && authState.accessToken) {
        this.extractUserRoles(authState.accessToken.claims);
      }
    });
  }

  private extractUserRoles(claims: any) {
    this.userRoles = [];
    
    // Try different role claim types
    const roleClaims = ['roles', 'role', 'groups'];
    for (const claimType of roleClaims) {
      if (claims[claimType]) {
        if (Array.isArray(claims[claimType])) {
          this.userRoles = [...this.userRoles, ...claims[claimType]];
        } else {
          this.userRoles.push(claims[claimType]);
        }
      }
    }
    
    // Remove duplicates
    this.userRoles = [...new Set(this.userRoles)];
  }

  hasRole(role: string): boolean {
    return this.userRoles.includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isSalesUser(): boolean {
    return this.hasRole('salesuser');
  }

  isInventoryUser(): boolean {
    return this.hasRole('inventoryuser');
  }

  async logout() {
    await this.oktaAuth.signOut();
    this.router.navigate(['/']);
  }

  getUserName(): string {
    if (this.authState?.idToken?.claims) {
      return this.authState.idToken.claims['name'] || 
             this.authState.idToken.claims['preferred_username'] || 
             this.authState.idToken.claims['email'] || 
             'User';
    }
    return 'User';
  }

  getUserEmail(): string {
    if (this.authState?.idToken?.claims) {
      return this.authState.idToken.claims['email'] || '';
    }
    return '';
  }
}
