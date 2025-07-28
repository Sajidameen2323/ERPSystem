# Development Environment Setup Script for Windows

Write-Host "Setting up ERP System development environment..." -ForegroundColor Green

# Backend setup
Write-Host "1. Setting up backend configuration..." -ForegroundColor Yellow
Set-Location ERPSystem.Server
if (-not (Test-Path "appsettings.Development.json")) {
    Copy-Item "appsettings.Development.template.json" "appsettings.Development.json"
    Write-Host "   ✅ Created appsettings.Development.json from template" -ForegroundColor Green
    Write-Host "   📝 Please edit appsettings.Development.json with your database connection and credentials" -ForegroundColor Cyan
} else {
    Write-Host "   ⚠️  appsettings.Development.json already exists" -ForegroundColor Yellow
}

# Frontend setup
Write-Host "2. Setting up frontend configuration..." -ForegroundColor Yellow
Set-Location ../erpsystem.client/src/environments
if (-not (Test-Path "environment.local.ts")) {
    Copy-Item "environment.local.template.ts" "environment.local.ts"
    Write-Host "   ✅ Created environment.local.ts from template" -ForegroundColor Green
    Write-Host "   📝 Please edit environment.local.ts with your Okta credentials" -ForegroundColor Cyan
} else {
    Write-Host "   ⚠️  environment.local.ts already exists" -ForegroundColor Yellow
}

# Install frontend dependencies
Write-Host "3. Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ../..
npm install
Write-Host "   ✅ Frontend dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit ERPSystem.Server/appsettings.Development.json with your database connection" -ForegroundColor White
Write-Host "2. Edit erpsystem.client/src/environments/environment.local.ts with your Okta credentials" -ForegroundColor White
Write-Host "3. Run 'dotnet run' from ERPSystem.Server directory to start the application" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed instructions, see DEVELOPMENT_SETUP.md" -ForegroundColor Cyan
