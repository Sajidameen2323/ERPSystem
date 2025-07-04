import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  // Test endpoints to verify auth interceptor and server authorization
  
  // Basic authentication test
  testAuth(): Observable<any> {
    console.log('📞 Making authenticated API call to /api/test');
    return this.http.get('/api/test');
  }

  // Get all claims from access token
  getClaims(): Observable<any> {
    console.log('📞 Making authenticated API call to /api/test/claims');
    return this.http.get('/api/test/claims');
  }

  // Admin-only endpoint (requires 'admin' role)
  getAdminData(): Observable<any> {
    console.log('📞 Making authenticated API call to /api/test/admin');
    return this.http.get('/api/test/admin');
  }

  // Sales user endpoint (requires 'salesuser' role)
  getSalesData(): Observable<any> {
    console.log('📞 Making authenticated API call to /api/test/sales');
    return this.http.get('/api/test/sales');
  }

  // Inventory user endpoint (requires 'inventoryuser' role)
  getInventoryData(): Observable<any> {
    console.log('📞 Making authenticated API call to /api/test/inventory');
    return this.http.get('/api/test/inventory');
  }

  // Manager endpoint (requires 'admin' OR 'salesuser' role)
  getManagerData(): Observable<any> {
    console.log('📞 Making authenticated API call to /api/test/manager');
    return this.http.get('/api/test/manager');
  }

  // Custom authorization test
  getCustomAuthData(): Observable<any> {
    console.log('📞 Making authenticated API call to /api/test/custom-auth');
    return this.http.get('/api/test/custom-auth');
  }

  // Get detailed token information
  getTokenInfo(): Observable<any> {
    console.log('📞 Making authenticated API call to /api/test/token-info');
    return this.http.get('/api/test/token-info');
  }

  // Legacy endpoints for backward compatibility
  getDashboardData(): Observable<any> {
    console.log('📞 Making authenticated API call to /api/dashboard');
    return this.http.get('/api/dashboard');
  }

  getUserProfile(): Observable<any> {
    console.log('📞 Making authenticated API call to /api/user/profile');
    return this.http.get('/api/user/profile');
  }
}
