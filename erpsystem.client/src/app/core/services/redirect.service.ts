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
    
    // Don't store login, callback, or unauthorized routes
    if (this.isPublicRoute(url)) {
      return;
    }

    // Clean the URL and ensure it's valid
    const cleanUrl = this.cleanUrl(url);
    if (!cleanUrl) {
      return;
    }


    try {
      sessionStorage.setItem(this.REDIRECT_KEY, cleanUrl);
      
      // Verify storage
      const storedRoute = sessionStorage.getItem(this.REDIRECT_KEY);
      if (storedRoute !== cleanUrl) {
      } else {
      }
    } catch (error) {
    }
  }

  /**
   * Get the stored intended route
   */
  getIntendedRoute(): string | null {
    try {
      const storedRoute = sessionStorage.getItem(this.REDIRECT_KEY);
      return storedRoute;
    } catch (error) {
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
    } catch (error) {
    }
  }

  /**
   * Navigate to intended route or fallback to dashboard
   */
  navigateToIntendedRoute(fallbackRoute: string = '/dashboard'): void {
    const intendedRoute = this.getIntendedRoute();
    
    if (intendedRoute && !this.isPublicRoute(intendedRoute)) {
      this.clearIntendedRoute();
      this.router.navigateByUrl(intendedRoute);
    } else {
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
    this.storeIntendedRoute(currentUrl);
    this.router.navigate(['/login']);
  }

}
