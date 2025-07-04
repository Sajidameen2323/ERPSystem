namespace ERPSystem.Server.Common;

public static class Constants
{
    public static class Roles
    {
        public const string Admin = "admin";
        public const string SalesUser = "salesuser";
        public const string InventoryUser = "inventoryuser";
    }

    public static class Policies
    {
        public const string AdminOnly = "AdminOnly";
        public const string SalesAccess = "SalesAccess";
        public const string InventoryAccess = "InventoryAccess";
        public const string ERPAccess = "ERPAccess";
    }

    public static class ClaimTypes
    {
        public const string UserId = "uid";
        public const string Email = "email";
        public const string Role = "role";
        public const string Roles = "roles";
    }

    public static class ApiMessages
    {
        public const string UserCreatedSuccessfully = "User created successfully";
        public const string UserNotFound = "User not found";
        public const string InvalidCredentials = "Invalid credentials";
        public const string UnauthorizedAccess = "Unauthorized access";
        public const string TokenValidationFailed = "Token validation failed";
        public const string ConfigurationError = "Configuration error";
        public const string InternalServerError = "An internal server error occurred";
    }

    public static class ApiRoutes
    {
        public const string Auth = "api/auth";
        public const string Users = "api/users";
    }

    public static class HttpHeaders
    {
        public const string Authorization = "Authorization";
        public const string ContentType = "Content-Type";
        public const string ApplicationJson = "application/json";
    }
}
