import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OKTA_AUTH } from '@okta/okta-angular';
import { from, switchMap, catchError } from 'rxjs';
import { of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const oktaAuth = inject(OKTA_AUTH);

  // Only add auth header for API requests (requests that go through proxy)
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }

  console.log('🔄 Intercepting API request:', req.url);

  // Get access token and add to request headers
  return from(Promise.resolve(oktaAuth.getAccessToken())).pipe(
    switchMap(accessToken => {
      if (accessToken) {
        console.log('🔑 Adding access token to request headers');
        
        const authReq = req.clone({
          setHeaders: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        return next(authReq);
      } else {
        console.log('⚠️ No access token available for API request');
        return next(req);
      }
    }),
    catchError(error => {
      console.error('❌ Error getting access token for API request:', error);
      return next(req);
    })
  );
};
