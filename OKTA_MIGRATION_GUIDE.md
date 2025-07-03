# Okta Authentication Migration Guide

This document outlines the migration from ASP.NET Core Identity to Okta authentication in the ERP System.

## Overview

The ERP System has been successfully migrated from using ASP.NET Core Identity to Okta for authentication and authorization. This provides enterprise-grade identity management with better scalability and security features.

## Changes Made

### 1. Backend Changes

#### Configuration
- Added `OktaSettings` configuration class in `Configuration/OktaSettings.cs`
- Updated `appsettings.json` with Okta configuration:
  ```json
  {
    "Okta": {
      "OktaDomain": "https://trial-1358401-admin.okta.com",
      "AuthorizationServerId": "0oasufj4o3YRr4wqQ697",
      "Audience": "api://my-app",
      "ApiToken": "00224TYv5OKhJJomoUjt8ygS1lPgmG0eqXhZT2u-1E"
    }
  }
  ```

#### Services
- **Removed**: `IAuthService` and `AuthService` (old Identity-based)
- **Added**: `IOktaAuthService` and `OktaAuthService` for Okta integration
- **Removed**: Identity-related services from `Program.cs`
- **Added**: Okta Web API authentication configuration

#### Controllers
- **Updated**: `AuthController` to use Okta authentication
- **New endpoints**:
  - `POST /api/auth/okta-login` - Authenticate with Okta access token
  - `GET /api/auth/profile` - Get current user profile
  - `POST /api/auth/deactivate/{userId}` - Deactivate user (Admin only)
  - `GET /api/auth/groups/{userId}` - Get user groups/roles

#### DTOs
- **Added**: `OktaLoginResponse`, `OktaUserDto`, `OktaTokenValidationRequest`
- **Updated**: Existing DTOs to work with Okta user data

#### Database
- **Removed**: Identity tables are no longer used
- **Note**: Existing migration history is preserved but seeding is removed

### 2. Package Changes

#### Removed Packages
- `Microsoft.AspNetCore.Identity.EntityFrameworkCore`
- `Okta.Sdk` (replaced with direct HTTP calls)
- `System.IdentityModel.Tokens.Jwt`

#### Retained Packages
- `Okta.AspNetCore` - For JWT token validation
- `Microsoft.AspNetCore.Authentication.JwtBearer` - For authentication middleware

## Okta Setup Requirements

### 1. Okta Organization Setup
1. Create an Okta developer account at https://developer.okta.com/
2. Set up your Okta organization
3. Create an authorization server
4. Create an application for the ERP System

### 2. Required Okta Groups
Create the following groups in your Okta organization to map to application roles:
- `erp-admin` → Maps to `Admin` role
- `erp-sales` → Maps to `SalesUser` role
- `erp-inventory` → Maps to `InventoryUser` role

### 3. Application Configuration
Update your `appsettings.json` with your Okta organization details:
- `OktaDomain`: Your Okta domain (e.g., https://dev-123456.okta.com)
- `AuthorizationServerId`: Your authorization server ID
- `Audience`: Your application's audience
- `ApiToken`: API token for server-to-server communication

## Authentication Flow

### 1. Client-Side Authentication
1. User authenticates with Okta (typically using Okta's hosted login page)
2. Client receives an access token from Okta
3. Client sends the access token to the API

### 2. Server-Side Validation
1. API receives the access token
2. Token is validated using Okta's introspection endpoint
3. User profile is fetched from Okta
4. User groups are mapped to application roles
5. User is authenticated and authorized

## API Usage Examples

### Login with Okta Token
```http
POST /api/auth/okta-login
Content-Type: application/json

{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlJTQTIwNDgiLCJhbXIiOlsicHdkIl0sImV4cCI6MTcwNzg2MTYwNywiaWF0IjoxNzA3ODYxNTQ3fQ..."
}
```

### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <okta-access-token>
```

### Create User (Admin only)
```http
POST /api/auth/register
Authorization: Bearer <admin-access-token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "password": "TempPassword123!",
  "roles": ["SalesUser"]
}
```

## Role Mapping

The system maps Okta groups to application roles as follows:

| Okta Group | Application Role | Description |
|------------|------------------|-------------|
| `erp-admin` or `administrators` | `Admin` | Full system access |
| `erp-sales` or `sales` | `SalesUser` | Sales module access |
| `erp-inventory` or `inventory` | `InventoryUser` | Inventory module access |

## Frontend Integration

### Required Changes for Frontend
1. **Remove** Identity-based login components
2. **Add** Okta authentication SDK (e.g., @okta/okta-auth-js for Angular)
3. **Update** login flow to use Okta hosted pages or embedded authentication
4. **Modify** HTTP interceptors to include Okta access tokens
5. **Update** user profile management to use Okta user data

### Example Angular Integration
```typescript
// Install: npm install @okta/okta-auth-js @okta/okta-angular

// app.config.ts
import { OktaAuthModule } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';

const oktaAuth = new OktaAuth({
  issuer: 'https://your-okta-domain/oauth2/your-auth-server-id',
  clientId: 'your-client-id',
  redirectUri: window.location.origin + '/login/callback'
});

// auth.service.ts
import { OktaAuthStateService } from '@okta/okta-angular';

constructor(private oktaAuthStateService: OktaAuthStateService) {}

async login() {
  await this.oktaAuthStateService.oktaAuth.signInWithRedirect();
}
```

## Testing

### Manual Testing
1. Ensure Okta organization is properly configured
2. Create test users and assign them to appropriate groups
3. Test authentication flow with different user roles
4. Verify API endpoints with proper authorization

### Unit Testing
- Update existing unit tests to mock Okta services
- Add tests for new Okta-specific functionality
- Test role mapping logic

## Security Considerations

1. **Token Storage**: Store Okta tokens securely (e.g., httpOnly cookies)
2. **Token Refresh**: Implement token refresh logic
3. **Logout**: Properly handle logout to clear Okta session
4. **API Keys**: Keep Okta API tokens secure and rotate regularly
5. **CORS**: Configure CORS properly for Okta domains

## Troubleshooting

### Common Issues
1. **Token Validation Errors**: Check authorization server configuration
2. **User Not Found**: Ensure user exists in Okta and is active
3. **Role Mapping Issues**: Verify group names match expected patterns
4. **CORS Errors**: Add Okta domains to allowed origins

### Debugging
- Enable detailed logging for authentication
- Use Okta's system log for debugging
- Check network requests for proper token format

## Migration Checklist

- [x] Remove Identity dependencies from backend
- [x] Add Okta authentication service
- [x] Update controllers to use Okta
- [x] Configure Okta settings
- [x] Update project packages
- [ ] Create Okta groups and users
- [ ] Update frontend to use Okta
- [ ] Test complete authentication flow
- [ ] Deploy and configure production Okta settings

## Support and Documentation

- [Okta Developer Documentation](https://developer.okta.com/docs/)
- [Okta ASP.NET Core SDK](https://github.com/okta/okta-aspnet)
- [Okta Angular SDK](https://github.com/okta/okta-angular)
