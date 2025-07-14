import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OKTA_AUTH } from '@okta/okta-angular';
import { GlobalLoadingService } from '../core/services/global-loading.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  
  private oktaAuth = inject(OKTA_AUTH);
  private router = inject(Router);
  private globalLoadingService = inject(GlobalLoadingService);
  
  public isLoading = false;

  ngOnInit(): void {
    // Component initialization - authentication is handled by guards
  }

  async login(): Promise<void> {
    try {
      this.isLoading = true;
      this.globalLoadingService.show('Redirecting to authentication...');
      await this.oktaAuth.signInWithRedirect();
    } catch (error) {
      console.error('Login error:', error);
      this.globalLoadingService.hide();
    } finally {
      this.isLoading = false;
    }
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
