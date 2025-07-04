namespace ERPSystem.Server.DTOs.Auth;

public class OktaTokenValidationRequest
{
    public string AccessToken { get; set; } = string.Empty;
}

public class OktaUserRegistrationRequest
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public List<string> Groups { get; set; } = new();
}
