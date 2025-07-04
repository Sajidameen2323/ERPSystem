using System.ComponentModel.DataAnnotations;
using ERPSystem.Server.Common;

namespace ERPSystem.Server.DTOs.Auth.Validation;

public class ValidRolesAttribute : ValidationAttribute
{
    private static readonly string[] ValidRoles = 
    {
        Constants.Roles.Admin,
        Constants.Roles.SalesUser,
        Constants.Roles.InventoryUser
    };

    public override bool IsValid(object? value)
    {
        if (value is not List<string> roles)
        {
            return false;
        }

        // Must have at least one role
        if (!roles.Any())
        {
            ErrorMessage = "At least one role must be assigned";
            return false;
        }

        // All roles must be valid
        var invalidRoles = roles.Where(role => !ValidRoles.Contains(role)).ToList();
        if (invalidRoles.Any())
        {
            ErrorMessage = $"Invalid roles: {string.Join(", ", invalidRoles)}. Valid roles are: {string.Join(", ", ValidRoles)}";
            return false;
        }

        // No duplicate roles
        if (roles.Count != roles.Distinct().Count())
        {
            ErrorMessage = "Duplicate roles are not allowed";
            return false;
        }

        return true;
    }
}

public static class RoleValidationExtensions
{
    public static List<string> GetValidRoles()
    {
        return new List<string>
        {
            Constants.Roles.Admin,
            Constants.Roles.SalesUser,
            Constants.Roles.InventoryUser
        };
    }

    public static bool IsValidRole(string role)
    {
        return GetValidRoles().Contains(role);
    }
}
