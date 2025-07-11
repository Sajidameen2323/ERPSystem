using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.DTOs.Auth;

public class AssignRolesDto
{
    [Required]
    public List<string> Roles { get; set; } = new();
}

public class UserSearchRequest
{
    public string? SearchTerm { get; set; }
    public bool? IsActive { get; set; }
}
