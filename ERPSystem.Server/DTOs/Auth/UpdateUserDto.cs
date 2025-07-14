using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.DTOs.Auth;

public class UpdateUserDto
{
    [Required(ErrorMessage = "First name is required")]
    [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
    public string LastName { get; set; } = string.Empty;

    [StringLength(100, ErrorMessage = "Display name cannot exceed 100 characters")]
    public string? DisplayName { get; set; }

    [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 100 characters")]
    public string? Password { get; set; }

    public string[]? Roles { get; set; }
}
