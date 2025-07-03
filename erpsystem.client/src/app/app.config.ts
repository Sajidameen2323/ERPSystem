import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { OKTA_CONFIG, OktaAuthStateService, OKTA_AUTH } from '@okta/okta-angular';
import { OktaAuth, OktaAuthOptions } from '@okta/okta-auth-js';

import { routes } from './app.routes';

const oktaConfig: OktaAuthOptions = {
  issuer: 'https://trial-1358401.okta.com/oauth2/default',
  clientId: '0oasufbxz8RxDLA0w697',
  redirectUri: window.location.origin + '/login/callback',
  scopes: ['openid', 'profile', 'email'],
  pkce: true
};

const oktaAuth = new OktaAuth(oktaConfig);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: OKTA_CONFIG, useValue: { oktaAuth } },
    { provide: OKTA_AUTH, useValue: oktaAuth },
    OktaAuthStateService
  ]
};
