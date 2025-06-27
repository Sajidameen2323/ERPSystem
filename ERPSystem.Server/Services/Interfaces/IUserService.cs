using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Auth;

namespace ERPSystem.Server.Services.Interfaces;

public interface IUserService
{
    Task<Result<PagedResult<UserDto>>> GetUsersAsync(UserSearchRequest request);
    Task<Result<UserDto>> GetUserByIdAsync(string userId);
    Task<Result> AssignRolesAsync(string userId, List<string> roles);
    Task<Result> DeactivateUserAsync(string userId);
    Task<Result> ActivateUserAsync(string userId);
    Task<Result<UserDto>> GetCurrentUserProfileAsync(string userId);
}
