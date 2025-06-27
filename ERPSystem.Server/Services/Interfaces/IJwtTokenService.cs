namespace ERPSystem.Server.Services.Interfaces;

public interface IJwtTokenService
{
    Task<string> GenerateTokenAsync(string userId);
    Task<bool> ValidateTokenAsync(string token);
    string? GetUserIdFromToken(string token);
}
