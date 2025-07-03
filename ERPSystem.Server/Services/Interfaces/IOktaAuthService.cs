using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Auth;

namespace ERPSystem.Server.Services.Interfaces;

public interface IOktaAuthService
{
    Task<Result<OktaLoginResponse>> AuthenticateWithOktaAsync(string accessToken);
    Task<Result<OktaLoginResponse>> ExchangeCodeForTokensAsync(OktaTokenExchangeRequest request);
    Task<Result<UserDto>> GetUserProfileAsync(string userId);
    Task<Result<UserDto>> CreateUserAsync(RegisterDto registerDto);
    Task<Result> DeactivateUserAsync(string userId);
    Task<Result<List<string>>> GetUserGroupsAsync(string userId);
    Task<Result<List<UserDto>>> GetAllUsersAsync(string? searchTerm = null, bool? isActive = null, int limit = 200);
}
