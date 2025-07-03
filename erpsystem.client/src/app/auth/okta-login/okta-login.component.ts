import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OktaService } from '../../core/services/okta.service';

@Component({
  selector: 'app-okta-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './okta-login.component.html',
  styleUrl: './okta-login.component.css'
})
export class OktaLoginComponent implements OnInit {
  loading = false;
  error: string | null = null;
  returnUrl: string = '/dashboard';

  constructor(
    private oktaService: OktaService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get return URL from query parameters
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // Store return URL for after login
    if (this.returnUrl) {
      localStorage.setItem('okta_return_url', this.returnUrl);
    }
  }

  async signInWithRedirect(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      // Use Okta SDK to initiate sign-in with redirect
      await this.oktaService.signInWithRedirect(this.returnUrl);
    } catch (error: any) {
      this.error = error?.message || 'Failed to initiate Okta login';
      this.loading = false;
      console.error('Okta sign-in error:', error);
    }
  }

  // Helper method to go back to main login
  goToMainLogin(): void {
    this.router.navigate(['/login']);
  }
}
