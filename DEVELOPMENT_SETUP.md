# Development Environment Setup

## Configuration Strategy

This project uses a simple file-based configuration approach:
- **appsettings.json** is tracked in git with empty placeholder values for production
- **appsettings.Development.json** is NOT tracked in git and contains actual development credentials
- **appsettings.Development.template.json** is tracked as a template with example values

## Setting up Development Configuration

### For New Developers

1. Navigate to the server project directory:
   ```powershell
   cd ERPSystem.Server
   ```

2. Copy the template file to create your development configuration:
   ```powershell
   Copy-Item "appsettings.Development.template.json" "appsettings.Development.json"
   ```

3. Edit `appsettings.Development.json` with your specific configuration values:
   - Update the connection string for your local database
   - Set appropriate JWT secret key
   - Configure Okta settings with your credentials

### Configuration Files

- **appsettings.json**: Production configuration with empty placeholder values (tracked in git)
- **appsettings.Development.json**: Development configuration with real values (NOT tracked in git)
- **appsettings.Development.template.json**: Template file showing structure and example values (tracked in git)

### File Structure

```
ERPSystem.Server/
├── appsettings.json                      (tracked - empty values)
├── appsettings.Development.json          (NOT tracked - your local config)
└── appsettings.Development.template.json (tracked - template with examples)
```

### For Production Deployment

Fill in the empty values in `appsettings.json` or use environment variables:
- `ConnectionStrings__DefaultConnection`
- `JwtSettings__SecretKey`
- `Okta__OktaDomain`
- `Okta__ClientId`
- `Okta__ClientAppId`
- `Okta__AuthorizationServerId`
- `Okta__Audience`
- `Okta__ApiToken`

### Security Notes

- `appsettings.Development.json` is ignored by git and contains sensitive data
- Never commit the actual development configuration file
- Use the template file as a reference for required configuration structure
- Production deployments should use environment variables or Azure Key Vault
