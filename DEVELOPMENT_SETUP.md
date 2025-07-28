# Development Environment Setup

## Setting up User Secrets

This project uses .NET User Secrets to store sensitive configuration data like connection strings, JWT keys, and Okta credentials. This keeps sensitive data out of source control.

### For New Developers

1. Navigate to the server project directory:
   ```powershell
   cd ERPSystem.Server
   ```

2. Initialize user secrets (if not already done):
   ```powershell
   dotnet user-secrets init
   ```

3. Set the required secrets:

   **Connection String:**
   ```powershell
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "YOUR_CONNECTION_STRING"
   ```

   **JWT Settings:**
   ```powershell
   dotnet user-secrets set "JwtSettings:SecretKey" "YOUR_JWT_SECRET_KEY"
   ```

   **Okta Configuration:**
   ```powershell
   dotnet user-secrets set "Okta:OktaDomain" "YOUR_OKTA_DOMAIN"
   dotnet user-secrets set "Okta:ClientId" "YOUR_CLIENT_ID"
   dotnet user-secrets set "Okta:ClientAppId" "YOUR_CLIENT_APP_ID"
   dotnet user-secrets set "Okta:AuthorizationServerId" "YOUR_AUTHORIZATION_SERVER_ID"
   dotnet user-secrets set "Okta:Audience" "YOUR_AUDIENCE"
   dotnet user-secrets set "Okta:ApiToken" "YOUR_API_TOKEN"
   ```

### Viewing Current Secrets

To see all configured secrets:
```powershell
dotnet user-secrets list
```

### Template File

A template file `appsettings.Development.template.json` is provided to show the structure of required configuration.

### Security Notes

- User secrets are stored locally on your machine and are not included in source control
- The `appsettings.Development.json` file now only contains non-sensitive logging configuration
- Never commit actual credentials to the repository
