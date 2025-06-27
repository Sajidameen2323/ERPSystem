using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Auth;

namespace ERPSystem.Server.Services.Interfaces;

public interface IAuthService
{
    Task<Result<LoginResponse>> LoginAsync(LoginDto loginDto);
    Task<Result<UserDto>> RegisterAsync(RegisterDto registerDto);
    Task<Result> LogoutAsync(string userId);
}
