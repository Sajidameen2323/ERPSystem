# Okta Token Exchange Implementation

## Overview
This document describes the implementation of Okta authentication with backend token exchange in the ERP System.

## Authentication Flow

### 1. Client-Side Authentication
1. User clicks login and is redirected to Okta's hosted login page via `signInWithRedirect()`
2. User authenticates with Okta
3. Okta redirects back to `/login/callback` with authorization code
4. Okta Angular SDK handles the PKCE code exchange and obtains access tokens
5. `OktaCallbackComponent` processes the callback using `OktaService.handleLoginRedirect()`

### 2. Backend Token Validation
1. Once authenticated, `OktaService` automatically calls `exchangeTokens()` 
2. Frontend sends the access token to backend endpoint: `POST /api/auth/okta-login`
3. Backend validates the access token with Okta's introspection endpoint
4. Backend returns user profile with roles/groups from Okta
5. Frontend stores user profile locally for application use

### 3. Key Components

#### Frontend (OktaService)
- **signInWithRedirect()**: Initiates Okta login flow
- **handleLoginRedirect()**: Processes callback and triggers token exchange  
- **exchangeTokens()**: Sends access token to backend for validation
- **validateTokenWithBackend()**: Manual token validation trigger
- **Reactive State**: Subscribes to Okta auth state changes

#### Backend (AuthController)
- **POST /api/auth/okta-login**: Validates access token and returns user profile
- Uses `OktaAuthService.AuthenticateWithOktaAsync()` for token introspection

## Configuration

### Frontend (app.config.ts)
```typescript
const oktaConfig: OktaAuthOptions = {
  issuer: 'https://trial-1358401.okta.com/oauth2/default',
  clientId: '0oasufbxz8RxDLA0w697', 
  redirectUri: window.location.origin + '/login/callback',
  scopes: ['openid', 'profile', 'email', 'groups'],
  pkce: true
};
```

### Backend (appsettings.json)
```json
{
  "Okta": {
    "OktaDomain": "https://trial-1358401.okta.com",
    "AuthorizationServerId": "default",
    "Audience": "api://default",
    "ClientId": "0oasufbxz8RxDLA0w697",
    "ClientSecret": "your-client-secret"
  }
}
```

## Security Features

1. **PKCE Flow**: Uses Proof Key for Code Exchange for enhanced security
2. **Token Introspection**: Backend validates tokens with Okta's API
3. **Automatic Token Exchange**: Seamless validation without exposing tokens
4. **Proper Logout**: Clears both local and Okta session state

## Error Handling

- Failed token exchange triggers automatic logout
- Network errors are caught and logged
- Invalid tokens result in user being redirected to login
- Graceful fallback for authentication state changes

## Usage Example

```typescript
// Inject OktaService in component
constructor(private oktaService: OktaService) {}

// Check authentication status
this.oktaService.isAuthenticated().subscribe(isAuth => {
  if (isAuth) {
    // User is authenticated
    const user = this.oktaService.getCurrentUser();
  }
});

// Initiate login
await this.oktaService.signInWithRedirect('/dashboard');

// Check user roles
if (this.oktaService.hasRole('Admin')) {
  // Show admin features
}
```

## Benefits

1. **Security**: No client-side token storage or validation
2. **Centralized**: All user data comes from backend with consistent format
3. **Scalable**: Backend can add additional user data/permissions 
4. **Maintainable**: Clear separation between auth and business logic
5. **Reliable**: Proper error handling and fallback mechanisms

## Testing

To test the implementation:

1. Start the backend server
2. Start the frontend application  
3. Navigate to `/login` and click "Sign in with Okta"
4. Complete authentication on Okta
5. Verify successful redirect to dashboard with user profile
6. Check browser network tab for token exchange request
7. Verify user roles/permissions are correctly loaded

## Troubleshooting

- **"No provider for okta.auth"**: Ensure both `OKTA_CONFIG` and `OKTA_AUTH` are provided in app.config.ts
- **Token exchange fails**: Check backend Okta configuration and API connectivity
- **User info not loading**: Verify token scopes include 'profile', 'email', 'groups'
- **Redirect loops**: Check redirect URI matches Okta app configuration exactly
