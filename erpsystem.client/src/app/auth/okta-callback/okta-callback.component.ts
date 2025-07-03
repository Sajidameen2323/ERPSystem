import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OktaService } from '../../core/services/okta.service';

@Component({
  selector: 'app-okta-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './okta-callback.component.html',
  styleUrl: './okta-callback.component.css'
})
export class OktaCallbackComponent implements OnInit {
  loading = true;
  error: string | null = null;

  constructor(
    private oktaService: OktaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.handleOktaCallback();
  }

  private async handleOktaCallback(): Promise<void> {
    try {
      // Handle the callback using Okta SDK
      await this.oktaService.handleLoginRedirect();
      
      this.loading = false;
      
      // Redirect to the return URL or dashboard
      const returnUrl = localStorage.getItem('okta_return_url') || '/dashboard';
      localStorage.removeItem('okta_return_url');
      this.router.navigate([returnUrl]);
    } catch (error: any) {
      this.loading = false;
      this.error = error.message || 'Authentication callback failed';
      console.error('Okta callback error:', error);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
