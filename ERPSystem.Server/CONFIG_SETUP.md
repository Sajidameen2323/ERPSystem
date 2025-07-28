# Server Configuration Setup

## Quick Start for New Developers

To set up your local development environment:

1. Copy the template file:
   ```powershell
   Copy-Item "appsettings.Development.template.json" "appsettings.Development.json"
   ```

2. Edit `appsettings.Development.json` with your local database connection string and credentials.

3. Run the application:
   ```powershell
   dotnet run
   ```

> **Note**: The `appsettings.Development.json` file is ignored by git, so your sensitive credentials stay local.

For detailed setup instructions, see the [DEVELOPMENT_SETUP.md](../DEVELOPMENT_SETUP.md) file in the project root.
