using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Auth;

namespace ERPSystem.Server.Services.Interfaces;

public interface IOktaService
{
    Task<Result<UserViewModel>> CreateUserAsync(RegisterUserDto registerDto);
    Task<Result<UserViewModel>> GetUserByIdAsync(string userId);
    Task<Result<List<UserViewModel>>> GetApplicationUsersAsync();
    Task<Result<UserViewModel>> ValidateTokenAsync(string accessToken);
    Task<Result<bool>> AssignUserToApplicationAsync(string userId);
    Task<Result<bool>> DeactivateUserAsync(string userId);
    Task<Result<bool>> ActivateUserAsync(string userId);
}
