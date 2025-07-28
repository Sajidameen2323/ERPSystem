# Environment Configuration

## File Structure

- `environment.ts` - Base development environment with placeholder values (tracked in git)
- `environment.prod.ts` - Production environment configuration (tracked in git)
- `environment.local.ts` - Local development with actual secrets (NOT tracked in git)
- `environment.local.template.ts` - Template for creating local environment (tracked in git)

## Setup for New Developers

1. Copy the template file:
   ```bash
   cp environment.local.template.ts environment.local.ts
   ```

2. Edit `environment.local.ts` with your actual Okta credentials:
   - Update `okta.issuer` with your Okta domain and authorization server ID
   - Update `okta.clientId` with your Okta client ID

3. The application will automatically use `environment.local.ts` for development

## Security Notes

- `environment.local.ts` is ignored by git and contains sensitive data
- Never commit actual credentials to the repository
- Use the template file as a reference for required configuration structure
- Production deployments should replace placeholder values with actual environment variables

## Current Configuration

The application imports from `environment.local` in development to ensure secrets are not exposed in the main environment files.
