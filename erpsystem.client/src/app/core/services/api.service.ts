import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  /**
   * Makes an authenticated API call to the specified endpoint.
   * @param endpoint The API endpoint to call.
   * @returns An Observable of the response data.
   */
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
