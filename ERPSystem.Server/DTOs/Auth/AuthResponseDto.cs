namespace ERPSystem.Server.DTOs.Auth;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = new();
    public DateTime ExpiresAt { get; set; }
}

public class OktaLoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string IdToken { get; set; } = string.Empty;
    public UserDto User { get; set; } = new();
    public DateTime ExpiresAt { get; set; }
    public List<string> Groups { get; set; } = new();
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public List<string> Roles { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}
