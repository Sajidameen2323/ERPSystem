import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { OktaAuthModule } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { caseConversionInterceptor } from './core/interceptors/case-conversion.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    importProvidersFrom(
      OktaAuthModule.forRoot({
        oktaAuth: new OktaAuth({
          issuer: 'https://trial-1358401.okta.com/oauth2/aussv4niagwBjnTwt697',
          clientId: '0oasufbxz8RxDLA0w697',
          redirectUri: `${window.location.origin}/login/callback`,
          scopes: ['openid', 'offline_access', 'profile']
        })
      })
    ),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, caseConversionInterceptor]))
  ]
};
