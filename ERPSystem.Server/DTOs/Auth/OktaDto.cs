namespace ERPSystem.Server.DTOs.Auth;

public class OktaUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public bool IsActive { get; set; }
    public List<string> Groups { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLogin { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class OktaTokenValidationRequest
{
    public string AccessToken { get; set; } = string.Empty;
}

public class OktaAuthorizationRequest
{
    public string Code { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
}

public class OktaTokenExchangeRequest
{
    public string Code { get; set; } = string.Empty;
    public string CodeVerifier { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
}

public class OktaTokenResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string TokenType { get; set; } = string.Empty;
    public int ExpiresIn { get; set; }
    public string Scope { get; set; } = string.Empty;
    public string IdToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}
