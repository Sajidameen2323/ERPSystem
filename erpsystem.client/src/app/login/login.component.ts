import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OKTA_AUTH } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';
import { ApiService } from '../core/services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  
  private oktaAuth = inject(OKTA_AUTH);
  private router = inject(Router);
  private apiService = inject(ApiService);
  
  public isLoading = false;
  public userInfo: any = null;
  public accessToken: string | null | undefined = null;
  public claims: any = null;
  public accessTokenClaims: any = null;

  ngOnInit(): void {
    console.log('Login component initialized');
    
    // The guest guard already ensures we only reach here if not authenticated
    // No additional authentication check needed
  }

  ngOnDestroy(): void {
    // No subscriptions to clean up since guest guard handles authentication
  }

  async login(): Promise<void> {
    try {
      this.isLoading = true;
      console.log('Initiating Okta login...');
      await this.oktaAuth.signInWithRedirect();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      // Note: isLoading will remain true until page redirect happens
      // This is expected behavior since the page will redirect during successful login
      this.isLoading = false;
    }
  }

  async logout(): Promise<void> {
    try {
      this.isLoading = true;
      console.log('Logging out...');
      await this.oktaAuth.signOut();
      this.userInfo = null;
      this.accessToken = null;
      this.claims = null;
      this.accessTokenClaims = null;
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadUserData(): Promise<void> {
    try {
      console.log('Loading user data...');
      
      // Get user info
      this.userInfo = await this.oktaAuth.getUser();
      console.log('🧑‍💼 User Info:', this.userInfo);
      
      // Get access token
      this.accessToken = await this.oktaAuth.getAccessToken();
      console.log('🔑 Access Token:', this.accessToken);
      
      // Get claims from access token (primary source for roles)
      if (this.accessToken) {
        this.accessTokenClaims = this.oktaAuth.token.decode(this.accessToken);
        console.log('🎫 Access Token Claims (Primary for Roles):', this.accessTokenClaims);
        console.table(this.accessTokenClaims);
        
        // Log roles specifically from access token
        if (this.accessTokenClaims.roles) {
          console.log('👥 User Roles from Access Token:', this.accessTokenClaims.roles);
        }
      }
      
      // Get claims from ID token (for additional user info)
      const idToken = await this.oktaAuth.getIdToken();
      if (idToken) {
        this.claims = this.oktaAuth.token.decode(idToken);
        console.log('📋 ID Token Claims (User Info):', this.claims);
        console.table(this.claims);
      }
      
      console.log('User data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }
  
  testApiCall(): void {
    console.log('🧪 Testing basic API call with auth interceptor...');
    this.testBasicAuth();
  }
  
  testBasicAuth(): void {
    console.log('🧪 Testing basic authentication...');
    this.apiService.testAuth().subscribe({
      next: (response) => {
        console.log('✅ Basic auth test successful:', response);
        alert(`✅ Basic Auth Success!\nMessage: ${response.data?.message || 'Authentication successful'}`);
      },
      error: (error) => {
        console.error('❌ Basic auth test failed:', error);
        alert(`❌ Basic Auth Failed!\nStatus: ${error.status}\nError: ${error.error?.message || error.message}`);
      }
    });
  }
  
  testClaims(): void {
    console.log('📋 Testing claims retrieval...');
    this.apiService.getClaims().subscribe({
      next: (response) => {
        console.log('✅ Claims test successful:', response);
        const claimCount = response.data?.totalClaims || 0;
        const roles = response.data?.parsedRoles || [];
        alert(`✅ Claims Retrieved!\nTotal Claims: ${claimCount}\nRoles: ${roles.join(', ')}`);
      },
      error: (error) => {
        console.error('❌ Claims test failed:', error);
        alert(`❌ Claims Test Failed!\nStatus: ${error.status}\nError: ${error.error?.message || error.message}`);
      }
    });
  }
  
  testAdminAuth(): void {
    console.log('🛡️ Testing admin authorization...');
    this.apiService.getAdminData().subscribe({
      next: (response) => {
        console.log('✅ Admin auth test successful:', response);
        alert(`✅ Admin Access Granted!\nMessage: ${response.data?.message || 'Admin access successful'}`);
      },
      error: (error) => {
        console.error('❌ Admin auth test failed:', error);
        const errorMsg = error.status === 403 ? 'Access Denied - Admin role required' : error.error?.message || error.message;
        alert(`❌ Admin Test Failed!\nStatus: ${error.status}\nError: ${errorMsg}`);
      }
    });
  }
  
  testSalesAuth(): void {
    console.log('💼 Testing sales authorization...');
    this.apiService.getSalesData().subscribe({
      next: (response) => {
        console.log('✅ Sales auth test successful:', response);
        alert(`✅ Sales Access Granted!\nMessage: ${response.data?.message || 'Sales access successful'}`);
      },
      error: (error) => {
        console.error('❌ Sales auth test failed:', error);
        const errorMsg = error.status === 403 ? 'Access Denied - Sales role required' : error.error?.message || error.message;
        alert(`❌ Sales Test Failed!\nStatus: ${error.status}\nError: ${errorMsg}`);
      }
    });
  }
  
  testInventoryAuth(): void {
    console.log('📦 Testing inventory authorization...');
    this.apiService.getInventoryData().subscribe({
      next: (response) => {
        console.log('✅ Inventory auth test successful:', response);
        alert(`✅ Inventory Access Granted!\nMessage: ${response.data?.message || 'Inventory access successful'}`);
      },
      error: (error) => {
        console.error('❌ Inventory auth test failed:', error);
        const errorMsg = error.status === 403 ? 'Access Denied - Inventory role required' : error.error?.message || error.message;
        alert(`❌ Inventory Test Failed!\nStatus: ${error.status}\nError: ${errorMsg}`);
      }
    });
  }
  
  testManagerAuth(): void {
    console.log('👔 Testing manager authorization...');
    this.apiService.getManagerData().subscribe({
      next: (response) => {
        console.log('✅ Manager auth test successful:', response);
        alert(`✅ Manager Access Granted!\nMessage: ${response.data?.message || 'Manager access successful'}`);
      },
      error: (error) => {
        console.error('❌ Manager auth test failed:', error);
        const errorMsg = error.status === 403 ? 'Access Denied - Admin or Sales role required' : error.error?.message || error.message;
        alert(`❌ Manager Test Failed!\nStatus: ${error.status}\nError: ${errorMsg}`);
      }
    });
  }
  
  testTokenInfo(): void {
    console.log('🔍 Testing token info retrieval...');
    this.apiService.getTokenInfo().subscribe({
      next: (response) => {
        console.log('✅ Token info test successful:', response);
        const tokenPresent = response.data?.tokenPresent ? 'Yes' : 'No';
        const claimCount = response.data?.claimCount || 0;
        alert(`✅ Token Info Retrieved!\nToken Present: ${tokenPresent}\nClaim Count: ${claimCount}`);
      },
      error: (error) => {
        console.error('❌ Token info test failed:', error);
        alert(`❌ Token Info Test Failed!\nStatus: ${error.status}\nError: ${error.error?.message || error.message}`);
      }
    });
  }
  
  getUserRoles(): string[] {
    // Priority: Get roles from access token claims first
    if (this.accessTokenClaims && this.accessTokenClaims.roles) {
      return this.accessTokenClaims.roles;
    }
    
    // Fallback: Get roles from ID token claims
    if (this.claims && this.claims.roles) {
      return this.claims.roles;
    }
    
    return [];
  }
  
  getAccessTokenClaimsArray(): Array<{key: string, value: any}> {
    if (!this.accessTokenClaims) return [];
    
    return Object.keys(this.accessTokenClaims).map(key => ({
      key: key,
      value: typeof this.accessTokenClaims[key] === 'object' 
        ? JSON.stringify(this.accessTokenClaims[key], null, 2)
        : this.accessTokenClaims[key]
    }));
  }
  
  getClaimsArray(): Array<{key: string, value: any}> {
    if (!this.claims) return [];
    
    return Object.keys(this.claims).map(key => ({
      key: key,
      value: typeof this.claims[key] === 'object' 
        ? JSON.stringify(this.claims[key], null, 2)
        : this.claims[key]
    }));
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
