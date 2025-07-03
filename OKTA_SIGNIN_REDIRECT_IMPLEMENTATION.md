# Okta Sign-In with Redirect Implementation

This document describes the complete implementation of Okta sign-in with redirect using PKCE (Proof Key for Code Exchange) for enhanced security.

## Overview

The implementation consists of:
1. **Frontend**: Angular components and services for Okta authentication
2. **Backend**: ASP.NET Core API endpoints for token exchange
3. **Flow**: Sign-in with redirect using PKCE for secure authorization code exchange

## Frontend Implementation

### 1. OktaConfigService
- **Location**: `erpsystem.client/src/app/core/services/okta-config.service.ts`
- **Purpose**: Manages Okta configuration and PKCE parameters
- **Key Methods**:
  - `getAuthorizationUrl()`: Generates authorization URL with PKCE challenge
  - `generateCodeVerifier()`: Creates secure code verifier
  - `generateCodeChallenge()`: Creates SHA256 hash of code verifier
  - `getStoredCodeVerifier()`: Retrieves stored code verifier for token exchange
  - `clearPKCEData()`: Cleans up stored PKCE data after successful exchange

### 2. OktaLoginComponent
- **Location**: `erpsystem.client/src/app/auth/okta-login/okta-login.component.ts`
- **Route**: `/login/okta`
- **Purpose**: Initiates sign-in with redirect
- **Key Method**: `signInWithRedirect()`: Redirects user to Okta for authentication

### 3. OktaCallbackComponent
- **Location**: `erpsystem.client/src/app/auth/okta-callback/okta-callback.component.ts`
- **Route**: `/login/callback`
- **Purpose**: Handles callback from Okta and exchanges authorization code for tokens
- **Flow**:
  1. Extracts authorization code and state from URL parameters
  2. Retrieves stored code verifier from localStorage
  3. Calls backend API to exchange code for access token
  4. Sets authentication state and redirects to return URL

### 4. AuthService
- **Location**: `erpsystem.client/src/app/core/services/auth.service.ts`
- **New Method**: `exchangeCodeForTokens()`: Calls backend API for token exchange
- **Existing Method**: `validateOktaToken()`: Validates access tokens (for backward compatibility)

### 5. Models
- **Location**: `erpsystem.client/src/app/core/models/index.ts`
- **New Interface**: `OktaTokenExchangeRequest` for PKCE token exchange

## Backend Implementation

### 1. DTOs
- **Location**: `ERPSystem.Server/DTOs/Auth/OktaDto.cs`
- **New Classes**:
  - `OktaTokenExchangeRequest`: Request model for authorization code exchange
  - `OktaTokenResponse`: Response model from Okta token endpoint

### 2. IOktaAuthService Interface
- **Location**: `ERPSystem.Server/Services/Interfaces/IOktaAuthService.cs`
- **New Method**: `ExchangeCodeForTokensAsync()`: Interface for token exchange

### 3. OktaAuthService Implementation
- **Location**: `ERPSystem.Server/Services/Implementations/OktaAuthService.cs`
- **New Method**: `ExchangeCodeForTokensAsync()`: 
  - Exchanges authorization code for access token using Okta's token endpoint
  - Validates the received access token
  - Returns authenticated user information

### 4. AuthController
- **Location**: `ERPSystem.Server/Controllers/AuthController.cs`
- **New Endpoint**: `POST /api/auth/okta-token-exchange`
  - Accepts `OktaTokenExchangeRequest`
  - Returns `OktaLoginResponse` with user info and access token

### 5. Configuration
- **Location**: `ERPSystem.Server/appsettings.Development.json`
- **New Section**: `OktaSettings` with Okta domain, client ID, and API token

## Authentication Flow

### 1. Sign-In Initiation
1. User navigates to `/login/okta`
2. `OktaLoginComponent` generates PKCE parameters
3. User is redirected to Okta authorization server
4. Code verifier is securely stored in localStorage

### 2. Authorization
1. User authenticates with Okta
2. Okta redirects back to `/login/callback` with authorization code and state

### 3. Token Exchange
1. `OktaCallbackComponent` extracts authorization code from URL
2. Retrieves stored code verifier
3. Calls backend `/api/auth/okta-token-exchange` endpoint
4. Backend exchanges code for access token with Okta
5. Backend validates token and returns user information
6. Frontend sets authentication state and redirects to dashboard

### 4. Session Management
1. Access token stored in localStorage as `okta_access_token`
2. User profile stored in localStorage as `current_user`
3. PKCE data cleaned up after successful exchange
4. Return URL handled for proper navigation

## Security Features

### 1. PKCE (Proof Key for Code Exchange)
- **Code Verifier**: Cryptographically random string (256-bit entropy)
- **Code Challenge**: SHA256 hash of code verifier, base64url encoded
- **Protection**: Prevents authorization code interception attacks

### 2. State Parameter
- Random state parameter to prevent CSRF attacks
- Validated during callback processing

### 3. Secure Storage
- Code verifier stored temporarily in localStorage
- Cleaned up immediately after token exchange
- Access tokens stored securely for session management

## Configuration

### Frontend Configuration
```typescript
// OktaConfigService configuration
{
  issuer: 'https://trial-1358401.okta.com/oauth2/default',
  clientId: '0oasufbxz8RxDLA0w697',
  redirectUri: window.location.origin + '/login/callback',
  responseType: 'code',
  scopes: ['openid', 'profile', 'email', 'groups'],
  pkce: true
}
```

### Backend Configuration
```json
{
  "OktaSettings": {
    "OktaDomain": "https://trial-1358401.okta.com",
    "ClientId": "0oasufbxz8RxDLA0w697",
    "AuthorizationServerId": "default",
    "Audience": "api://default",
    "ApiToken": "YOUR_OKTA_API_TOKEN_HERE"
  }
}
```

## Usage

### 1. Login Flow
1. Navigate to `/login/okta`
2. Click "Sign in with Okta"
3. Complete authentication on Okta
4. Automatically redirected to dashboard

### 2. Logout Flow
- Call `AuthService.logout()` to clear session
- Optionally redirect to Okta logout endpoint

## Benefits

1. **Enhanced Security**: PKCE prevents code interception attacks
2. **User Experience**: Seamless redirect flow without popups
3. **Scalability**: Stateless backend, session managed on frontend
4. **Compatibility**: Works with all modern browsers
5. **Standards Compliance**: Follows OAuth 2.1 and OIDC specifications

## Testing

### Prerequisites
1. Valid Okta organization and application
2. Correct redirect URI configured in Okta
3. API token with appropriate permissions

### Test Scenarios
1. Successful login and redirect
2. Error handling for invalid codes
3. PKCE parameter validation
4. Session persistence across page refreshes
5. Logout and session cleanup

## Troubleshooting

### Common Issues
1. **Invalid Redirect URI**: Ensure callback URL matches Okta configuration
2. **CORS Issues**: Configure CORS policy for Okta domain
3. **Token Validation Failures**: Verify API token and permissions
4. **PKCE Validation Errors**: Check code verifier storage and retrieval

### Debug Tips
1. Check browser console for JavaScript errors
2. Monitor network requests to Okta endpoints
3. Verify stored PKCE data in localStorage
4. Check backend logs for token exchange errors

## Documentation References
- [RFC 7636 - PKCE](https://tools.ietf.org/html/rfc7636)
- [Okta Developer Documentation](https://developer.okta.com/)
- [OAuth 2.1 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
