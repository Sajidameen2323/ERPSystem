# Okta Angular SDK Implementation with Standalone Components

This document describes the complete implementation of Okta authentication using the official Okta Angular SDK with standalone components and sign-in with redirect pattern.

## Overview

The implementation uses:
- **Official Okta Angular SDK** (`@okta/okta-angular` and `@okta/okta-auth-js`)
- **Standalone Angular Components** (no NgModules)
- **Sign-in with Redirect** pattern for secure authentication
- **PKCE** (Proof Key for Code Exchange) enabled by default
- **Angular 18** application configuration

## Frontend Implementation

### 1. App Configuration (`app.config.ts`)
```typescript
const oktaConfig: OktaAuthOptions = {
  issuer: 'https://trial-1358401.okta.com/oauth2/default',
  clientId: '0oasufbxz8RxDLA0w697',
  redirectUri: window.location.origin + '/login/callback',
  scopes: ['openid', 'profile', 'email', 'groups'],
  pkce: true // PKCE enabled by default
};

const oktaAuth = new OktaAuth(oktaConfig);

export const appConfig: ApplicationConfig = {
  providers: [
    // ...other providers
    { provide: OKTA_CONFIG, useValue: { oktaAuth } },
    OktaAuthStateService
  ]
};
```

### 2. OktaService (Custom Wrapper)
- **Location**: `erpsystem.client/src/app/core/services/okta.service.ts`
- **Purpose**: Wrapper around Okta SDK for easier integration
- **Key Features**:
  - Automatic user profile conversion to internal format
  - Role-based access control helpers
  - Reactive authentication state management
  - LocalStorage compatibility for existing code

### 3. OktaLoginComponent
- **Location**: `erpsystem.client/src/app/auth/okta-login/okta-login.component.ts`
- **Route**: `/login/okta`
- **Implementation**:
```typescript
async signInWithRedirect(): Promise<void> {
  this.loading = true;
  this.error = null;
  
  try {
    await this.oktaService.signInWithRedirect(this.returnUrl);
  } catch (error: any) {
    this.error = error?.message || 'Failed to initiate Okta login';
    this.loading = false;
  }
}
```

### 4. OktaCallbackComponent
- **Location**: `erpsystem.client/src/app/auth/okta-callback/okta-callback.component.ts`
- **Route**: `/login/callback`
- **Implementation**:
```typescript
private async handleOktaCallback(): Promise<void> {
  try {
    await this.oktaService.handleLoginRedirect();
    
    const returnUrl = localStorage.getItem('okta_return_url') || '/dashboard';
    localStorage.removeItem('okta_return_url');
    this.router.navigate([returnUrl]);
  } catch (error: any) {
    this.error = error.message || 'Authentication callback failed';
  }
}
```

### 5. Updated Guards
- **Location**: `erpsystem.client/src/app/core/guards/auth.guard.ts`
- **Uses**: `OktaAuthStateService.authState$` for reactive authentication state
- **Implementation**:
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const oktaAuthStateService = inject(OktaAuthStateService);
  const router = inject(Router);

  return oktaAuthStateService.authState$.pipe(
    take(1),
    map((authState) => {
      if (authState?.isAuthenticated) {
        return true;
      }
      router.navigate(['/login/okta'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};
```

### 6. Updated Interceptor
- **Location**: `erpsystem.client/src/app/core/interceptors/auth.interceptor.ts`
- **Uses**: Okta SDK's `getAccessToken()` method
- **Implementation**:
```typescript
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  const accessToken = this.oktaAuth.getAccessToken();
  
  if (accessToken) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return next.handle(authReq);
  }
  
  return next.handle(req);
}
```

## Authentication Flow

### 1. Sign-In Initiation
1. User navigates to `/login/okta`
2. `OktaLoginComponent` calls `oktaService.signInWithRedirect()`
3. Okta SDK automatically handles PKCE parameter generation
4. User is redirected to Okta authorization server

### 2. Okta Authentication
1. User authenticates with Okta
2. Okta redirects back to `/login/callback` with authorization code

### 3. Token Exchange and Session Setup
1. `OktaCallbackComponent` calls `oktaService.handleLoginRedirect()`
2. Okta SDK automatically exchanges authorization code for tokens using PKCE
3. `OktaService` subscribes to auth state changes and:
   - Retrieves user profile from Okta
   - Converts to internal `UserProfile` format
   - Updates reactive state and localStorage
4. User is redirected to original destination

### 4. Session Management
- **Access Token**: Managed by Okta SDK, automatically refreshed
- **User Profile**: Stored in `OktaService` and localStorage
- **Authentication State**: Reactive via `OktaAuthStateService.authState$`

## Key Features

### 1. Official SDK Benefits
- **Automatic PKCE**: No manual code verifier/challenge generation
- **Token Management**: Automatic token refresh and validation
- **Security**: Built-in security best practices
- **Standards Compliance**: OAuth 2.1 and OIDC compliant

### 2. Standalone Components
- **No NgModules**: Uses Angular 18 standalone component architecture
- **Tree Shaking**: Better bundle optimization
- **Simpler Configuration**: Direct provider configuration in `app.config.ts`

### 3. Reactive Architecture
- **Observable State**: Authentication state via RxJS observables
- **Real-time Updates**: Automatic UI updates on auth state changes
- **Type Safety**: Full TypeScript support

### 4. Backward Compatibility
- **LocalStorage**: Maintains compatibility with existing code
- **UserProfile**: Converts Okta user to internal format
- **Role Management**: Preserves role-based access control

## Configuration

### Okta Application Settings
```json
{
  "client_id": "0oasufbxz8RxDLA0w697",
  "client_type": "SPA",
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "redirect_uris": ["http://localhost:4200/login/callback"],
  "post_logout_redirect_uris": ["http://localhost:4200"],
  "scopes": ["openid", "profile", "email", "groups"]
}
```

### Frontend Configuration
```typescript
// app.config.ts
const oktaConfig: OktaAuthOptions = {
  issuer: 'https://trial-1358401.okta.com/oauth2/default',
  clientId: '0oasufbxz8RxDLA0w697',
  redirectUri: window.location.origin + '/login/callback',
  scopes: ['openid', 'profile', 'email', 'groups'],
  pkce: true
};
```

## Usage Examples

### 1. Login
```typescript
// Navigate to login
this.router.navigate(['/login/okta']);

// Or programmatically initiate login
await this.oktaService.signInWithRedirect('/dashboard');
```

### 2. Check Authentication Status
```typescript
// Reactive approach
this.oktaService.isAuthenticated().subscribe(isAuth => {
  console.log('Authenticated:', isAuth);
});

// Synchronous approach
const user = this.oktaService.getCurrentUser();
```

### 3. Role-Based Access
```typescript
// Check specific role
if (this.oktaService.hasRole('Admin')) {
  // Admin functionality
}

// Check multiple roles
if (this.oktaService.hasAnyRole(['Admin', 'Manager'])) {
  // Management functionality
}
```

### 4. Logout
```typescript
await this.oktaService.signOut();
```

## Build Results

✅ **Frontend Build**: Successful with warnings about:
- Bundle size (528.16 kB vs 512 kB budget)
- CommonJS dependencies from Okta SDK (expected)

✅ **Backend Build**: Successful, maintains token exchange endpoint for flexibility

## Advantages of This Implementation

1. **Official Support**: Uses Okta's officially maintained SDK
2. **Automatic Security**: PKCE, token refresh, and security best practices built-in
3. **Modern Angular**: Standalone components with Angular 18
4. **Reactive**: Observable-based authentication state
5. **Type Safe**: Full TypeScript support throughout
6. **Flexible**: Maintains custom backend integration option
7. **Maintainable**: Less custom code, follows Okta best practices

## Migration from Custom Implementation

The new implementation maintains backward compatibility:
- Same routes (`/login/okta`, `/login/callback`)
- Same localStorage keys for compatibility
- Same `UserProfile` interface
- Same role-based access control methods

Users can seamlessly switch from custom PKCE implementation to official SDK without breaking existing functionality.

## Testing

### Prerequisites
1. Valid Okta organization with SPA application configured
2. Correct redirect URIs in Okta application settings
3. Required scopes and claims configured

### Test Scenarios
1. ✅ Successful login flow with redirect
2. ✅ Automatic token refresh
3. ✅ Role-based access control
4. ✅ Session persistence across page refreshes
5. ✅ Logout and session cleanup
6. ✅ Error handling for failed authentication

## Documentation References
- [Okta Angular SDK Documentation](https://github.com/okta/okta-angular)
- [Okta Auth JS Documentation](https://github.com/okta/okta-auth-js)
- [Angular Standalone Components](https://angular.dev/guide/components/importing)
- [OAuth 2.1 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
