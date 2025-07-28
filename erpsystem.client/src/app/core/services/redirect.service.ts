import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RedirectService {
  private readonly REDIRECT_KEY = 'intendedRoute';

  constructor(private router: Router) {}

  /**
   * Store the intended route that user was trying to access
   */
  storeIntendedRoute(url: string): void {
    console.log('🔍 RedirectService: Checking if route should be stored:', url);
    
    // Don't store login, callback, or unauthorized routes
    if (this.isPublicRoute(url)) {
      console.log('🚫 RedirectService: Not storing public route:', url);
      return;
    }

    console.log('✅ RedirectService: Route is protected, proceeding with storage:', url);

    // Clean the URL and ensure it's valid
    const cleanUrl = this.cleanUrl(url);
    if (!cleanUrl) {
      console.log('🚫 RedirectService: Invalid URL after cleaning, not storing:', url);
      return;
    }

    console.log('🧹 RedirectService: Cleaned URL:', cleanUrl);

    try {
      sessionStorage.setItem(this.REDIRECT_KEY, cleanUrl);
      console.log('💾 RedirectService: Successfully stored intended route:', cleanUrl);
      
      // Verify storage
      const storedRoute = sessionStorage.getItem(this.REDIRECT_KEY);
      if (storedRoute !== cleanUrl) {
        console.error('❌ RedirectService: Storage verification failed!', { stored: storedRoute, intended: cleanUrl });
      } else {
        console.log('✅ RedirectService: Storage verified successfully');
      }
    } catch (error) {
      console.error('❌ RedirectService: Error storing intended route:', error);
    }
  }

  /**
   * Get the stored intended route
   */
  getIntendedRoute(): string | null {
    try {
      const storedRoute = sessionStorage.getItem(this.REDIRECT_KEY);
      console.log('📖 RedirectService: Retrieved intended route:', storedRoute);
      return storedRoute;
    } catch (error) {
      console.error('❌ RedirectService: Error retrieving intended route:', error);
      return null;
    }
  }

  /**
   * Clear the stored intended route
   */
  clearIntendedRoute(): void {
    try {
      const existingRoute = sessionStorage.getItem(this.REDIRECT_KEY);
      sessionStorage.removeItem(this.REDIRECT_KEY);
      console.log('🗑️ RedirectService: Cleared intended route:', existingRoute);
    } catch (error) {
      console.error('❌ RedirectService: Error clearing intended route:', error);
    }
  }

  /**
   * Navigate to intended route or fallback to dashboard
   */
  navigateToIntendedRoute(fallbackRoute: string = '/dashboard'): void {
    const intendedRoute = this.getIntendedRoute();
    
    console.log('🔄 RedirectService: NavigateToIntendedRoute called');
    console.log('📍 Intended route:', intendedRoute);
    console.log('🔄 Fallback route:', fallbackRoute);
    
    if (intendedRoute && !this.isPublicRoute(intendedRoute)) {
      console.log('✅ RedirectService: Navigating to intended route:', intendedRoute);
      this.clearIntendedRoute();
      this.router.navigateByUrl(intendedRoute);
    } else {
      console.log('📍 RedirectService: No valid intended route, navigating to fallback:', fallbackRoute);
      this.router.navigate([fallbackRoute]);
    }
  }

  /**
   * Clean and validate URL
   */
  private cleanUrl(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Remove any hash fragments and query parameters for storage
    // but preserve the path
    let cleanUrl = url.split('?')[0].split('#')[0];
    
    // Ensure URL starts with /
    if (!cleanUrl.startsWith('/')) {
      cleanUrl = '/' + cleanUrl;
    }

    // Remove any double slashes
    cleanUrl = cleanUrl.replace(/\/+/g, '/');

    // Validate that it's a meaningful route (not just root)
    if (cleanUrl === '/') {
      return null;
    }

    // Must be at least 2 characters and start with /
    if (cleanUrl.length < 2) {
      return null;
    }

    return cleanUrl;
  }

  /**
   * Check if the given URL is a public route that doesn't need authentication
   */
  private isPublicRoute(url: string): boolean {
    const publicRoutes = ['/login', '/unauthorized', '/login/callback'];
    
    // Check for exact match of root path
    if (url === '/') {
      return true;
    }
    
    // Check if URL starts with any of the public route patterns
    return publicRoutes.some(route => url.startsWith(route));
  }

  /**
   * Store current route as intended route before redirecting to login
   */
  storeCurrentRouteAndRedirectToLogin(): void {
    const currentUrl = this.router.url;
    console.log('🔄 RedirectService: Storing current route before login redirect:', currentUrl);
    this.storeIntendedRoute(currentUrl);
    this.router.navigate(['/login']);
  }

  /**
   * Debug method to check session storage state
   */
  debugSessionStorage(): void {
    try {
      const storedRoute = sessionStorage.getItem(this.REDIRECT_KEY);
      const allKeys = Object.keys(sessionStorage);
      
      console.log('🔍 RedirectService Debug:');
      console.log('  - Stored intended route:', storedRoute);
      console.log('  - All session storage keys:', allKeys);
      console.log('  - Session storage length:', sessionStorage.length);
      
      // Check if sessionStorage is working
      const testKey = 'test_' + Date.now();
      sessionStorage.setItem(testKey, 'test_value');
      const testValue = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);
      
      console.log('  - Session storage test:', testValue === 'test_value' ? 'PASS' : 'FAIL');
    } catch (error) {
      console.error('❌ RedirectService: Session storage debug failed:', error);
    }
  }
}
