# Development Environment Setup

## Configuration Strategy

This project uses a simple file-based configuration approach:
- **Backend (ASP.NET Core)**: Uses appsettings files with local development configuration
- **Frontend (Angular)**: Uses TypeScript environment files with local configuration

## Recent Updates

### Enhanced Financial Metrics API

The dashboard now includes comprehensive financial metrics that aggregate data from multiple sources:

#### New API Endpoint: `/api/dashboard/financial-metrics`

**Purpose**: Provides complete financial overview including sales revenue, purchase costs, and returns.

**Data Sources**:
- **Sales Revenue**: From `Invoice` table (existing functionality)
- **Purchase Costs**: From `PurchaseOrder` table (newly implemented)
- **Purchase Returns**: From `PurchaseOrderReturn` table (newly implemented)

**Key Metrics Provided**:
- Sales metrics: Total revenue, paid amounts, outstanding, overdue
- Purchase metrics: Purchase costs, payments, outstanding amounts
- Return metrics: Total value of processed returns
- Combined metrics: Net cash flow, gross margin calculations

**Role-Based Access**: Only users with 'admin' or 'salesuser' roles can access financial data.

**Implementation Details**:
- Backend: Enhanced `DashboardController.GetComprehensiveFinancialMetrics()` method
- Frontend: Updated `DashboardService.getFinancialMetrics()` to use new endpoint
- Replaces the previous invoice-only approach with comprehensive financial tracking

## Backend Server Setup

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

## Frontend Client Setup

### For New Developers

1. Navigate to the client project directory:
   ```powershell
   cd erpsystem.client
   ```

2. Navigate to the environments directory:
   ```powershell
   cd src/environments
   ```

3. Copy the template file to create your local environment:
   ```powershell
   Copy-Item "environment.local.template.ts" "environment.local.ts"
   ```

4. Edit `environment.local.ts` with your actual Okta credentials:
   - Update `okta.issuer` with your Okta domain and authorization server ID
   - Update `okta.clientId` with your Okta client ID

5. Return to the client root and install dependencies:
   ```powershell
   cd ../..
   npm install
   ```

## File Structure

### Backend
```
ERPSystem.Server/
├── appsettings.json                      (tracked - empty values)
├── appsettings.Development.json          (NOT tracked - your local config)
└── appsettings.Development.template.json (tracked - template)
```

### Frontend
```
erpsystem.client/src/environments/
├── environment.ts                      (tracked - placeholder values)
├── environment.prod.ts                 (tracked - production config)
├── environment.local.ts                (NOT tracked - your local config)
├── environment.local.template.ts       (tracked - template)
└── README.md                          (setup instructions)
```

## Running the Application

1. Start the backend server (this will also start the frontend):
   ```powershell
   cd ERPSystem.Server
   dotnet run
   ```

2. Or individually test frontend:
   ```powershell
   cd erpsystem.client
   npm run build
   ```

## For Production Deployment

### Backend
Fill in the empty values in `appsettings.json` or use environment variables:
- `ConnectionStrings__DefaultConnection`
- `JwtSettings__SecretKey`
- `Okta__OktaDomain`
- `Okta__ClientId`
- etc.

### Frontend
Replace placeholder values in `environment.prod.ts` with actual production values during deployment.

## Security Notes

- Local development files (`appsettings.Development.json`, `environment.local.ts`) are ignored by git
- Never commit actual credentials to the repository
- Use template files as a reference for required configuration structure
- Production deployments should use secure configuration management (environment variables, Azure Key Vault, etc.)
