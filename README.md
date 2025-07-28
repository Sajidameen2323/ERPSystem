# ERP System

A modern Enterprise Resource Planning (ERP) system built with Angular 18 and ASP.NET Core 8.

## Overview

This ERP system provides comprehensive business management capabilities including inventory management, sales order processing, purchase order management, and customer relationship management.

## Technology Stack

### Frontend
- **Angular 18** - Modern web framework
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Angular** - Icon library
- **AG Grid** - Data grid component

### Backend
- **ASP.NET Core 8** - Web API framework
- **Entity Framework Core 8** - Object-relational mapping
- **SQL Server** - Database
- **AutoMapper** - Object mapping
- **Okta** - Authentication and authorization

## Project Structure

```
ERPSystem/
├── erpsystem.client/          # Angular frontend application
├── ERPSystem.Server/          # ASP.NET Core backend API
├── ERPSystem.sln             # Visual Studio solution file
└── README.md                 # Project documentation
```

## Features

- **Inventory Management** - Product catalog, stock tracking, and adjustments
- **Sales Management** - Sales orders, invoicing, and customer management
- **Purchase Management** - Purchase orders, supplier management, and returns
- **User Management** - Role-based access control with Okta integration
- **Responsive Design** - Works on desktop and mobile devices
- **Dark/Light Mode** - Theme switching support

## Getting Started

### Prerequisites
- .NET 8 SDK
- Node.js (v18 or later)
- SQL Server (LocalDB or full instance)

### Running the Application

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ERPSystem
   ```

2. **Start the backend server**
   ```bash
   cd ERPSystem.Server
   dotnet run
   ```
   The backend server will automatically start the frontend application.

3. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:5000

### Development

- **Frontend only**: Navigate to `erpsystem.client` and run `npm start`
- **Backend only**: Navigate to `ERPSystem.Server` and run `dotnet run`
- **Full application**: Run from `ERPSystem.Server` to start both frontend and backend

## Configuration

- **Database**: Connection string in `appsettings.json`
- **Okta**: Authentication settings in `appsettings.json`
- **Proxy**: Frontend proxy configuration in `proxy.conf.js`

## License

This project is for educational and practice purposes.
