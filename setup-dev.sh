#!/bin/bash
# Development Environment Setup Script

echo "Setting up ERP System development environment..."

# Backend setup
echo "1. Setting up backend configuration..."
cd ERPSystem.Server
if [ ! -f "appsettings.Development.json" ]; then
    cp "appsettings.Development.template.json" "appsettings.Development.json"
    echo "   ✅ Created appsettings.Development.json from template"
    echo "   📝 Please edit appsettings.Development.json with your database connection and credentials"
else
    echo "   ⚠️  appsettings.Development.json already exists"
fi

# Frontend setup
echo "2. Setting up frontend configuration..."
cd ../erpsystem.client/src/environments
if [ ! -f "environment.local.ts" ]; then
    cp "environment.local.template.ts" "environment.local.ts"
    echo "   ✅ Created environment.local.ts from template"
    echo "   📝 Please edit environment.local.ts with your Okta credentials"
else
    echo "   ⚠️  environment.local.ts already exists"
fi

# Install frontend dependencies
echo "3. Installing frontend dependencies..."
cd ../..
npm install
echo "   ✅ Frontend dependencies installed"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit ERPSystem.Server/appsettings.Development.json with your database connection"
echo "2. Edit erpsystem.client/src/environments/environment.local.ts with your Okta credentials"
echo "3. Run 'dotnet run' from ERPSystem.Server directory to start the application"
echo ""
echo "📚 For detailed instructions, see DEVELOPMENT_SETUP.md"
