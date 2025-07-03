namespace ERPSystem.Server.Configuration;

public class OktaSettings
{
    public string OktaDomain { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string AuthorizationServerId { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string ApiToken { get; set; } = string.Empty;
}
