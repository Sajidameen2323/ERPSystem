namespace ERPSystem.Server.Common;

public static class Constants
{
    public static class Roles
    {
        public const string Admin = "Admin";
        public const string SalesUser = "SalesUser";
        public const string InventoryUser = "InventoryUser";
    }

    public static class Policies
    {
        public const string AdminOnly = "AdminOnly";
        public const string SalesAccess = "SalesAccess";
        public const string InventoryAccess = "InventoryAccess";
    }

    public static class ClaimTypes
    {
        public const string UserId = "uid";
        public const string Email = "email";
        public const string Role = "role";
    }
}
