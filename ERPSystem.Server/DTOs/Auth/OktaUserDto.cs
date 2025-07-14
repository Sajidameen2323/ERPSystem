using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ERPSystem.Server.DTOs.Auth;

public class RegisterUserDto
{
    [Required(ErrorMessage = "First name is required")]
    [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 100 characters")]
    public string Password { get; set; } = string.Empty;

    public string[]? Roles { get; set; }
    public string[]? GroupIds { get; set; }
}

public class UserViewModel
{
    public string Id { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? Created { get; set; }

    [JsonPropertyName("LastLoginAt")]
    public DateTime? LastLoginAt { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string[]? Roles { get; set; }
}

public class OktaUserResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("created")]
    public DateTime Created { get; set; }

    [JsonPropertyName("credentials")]
    public OktaUserCredentials? Credentials { get; set; }

    [JsonPropertyName("profile")]
    public OktaUserProfile Profile { get; set; } = new();

    [JsonPropertyName("_embedded")]
    public OktaUserEmbedded? Embedded { get; set; }
}

public class OktaUserEmbedded
{
    [JsonPropertyName("user")]
    public EmbeddedUser? User { get; set; }
}

public class EmbeddedUser
{

    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("lastLogin")]
    public DateTime? LastLogin { get; set; }
}

public class OktaUserCredentials
{
    [JsonPropertyName("userName")]
    public string UserName { get; set; } = string.Empty;
}

public class OktaUserProfile
{
    [JsonPropertyName("given_name")]
    public string GivenName { get; set; } = string.Empty;
    
    [JsonPropertyName("family_name")]
    public string FamilyName { get; set; } = string.Empty;
    
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
    
    [JsonPropertyName("roles")]
    public string[]? Roles { get; set; }

    // Legacy properties for backward compatibility
    public string FirstName => GivenName;
    public string LastName => FamilyName;
    public string Login => Email;
}

public class TokenValidationRequest
{
    [Required(ErrorMessage = "Access token is required")]
    public string AccessToken { get; set; } = string.Empty;
}

public class TokenValidationResponse
{
    public bool IsValid { get; set; }
    public UserViewModel? User { get; set; }
    public string? Error { get; set; }
}

public class AuthResponse
{
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
    public UserViewModel? User { get; set; }
    public string? Error { get; set; }
}
