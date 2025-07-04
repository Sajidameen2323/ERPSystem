import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OktaAuthStateService, OKTA_AUTH } from '@okta/okta-angular';
import { AuthState } from '@okta/okta-auth-js';
import { inject } from '@angular/core';
import { LucideAngularModule, User, Mail, Calendar, Shield } from 'lucide-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private oktaAuthStateService = inject(OktaAuthStateService);
  
  readonly icons = {
    User,
    Mail,
    Calendar,
    Shield
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

  getUserInfo() {
    if (this.authState?.idToken?.claims) {
      return {
        name: this.authState.idToken.claims['name'] || 'N/A',
        email: this.authState.idToken.claims['email'] || 'N/A',
        preferredUsername: this.authState.idToken.claims['preferred_username'] || 'N/A',
        sub: this.authState.idToken.claims['sub'] || 'N/A',
        iss: this.authState.idToken.claims['iss'] || 'N/A',
        aud: this.authState.idToken.claims['aud'] || 'N/A',
        iat: this.authState.idToken.claims['iat'] ? new Date(this.authState.idToken.claims['iat'] * 1000) : null,
        exp: this.authState.idToken.claims['exp'] ? new Date(this.authState.idToken.claims['exp'] * 1000) : null
      };
    }
    return null;
  }

  getRoleBadgeClass(role: string): string {
    const roleClasses: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800',
      'salesuser': 'bg-blue-100 text-blue-800',
      'inventoryuser': 'bg-green-100 text-green-800'
    };
    return roleClasses[role] || 'bg-gray-100 text-gray-800';
  }
}
