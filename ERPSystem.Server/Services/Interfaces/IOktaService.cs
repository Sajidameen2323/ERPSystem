using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Auth;

namespace ERPSystem.Server.Services.Interfaces;

public interface IOktaService
{
    Task<Result<UserViewModel>> CreateUserAsync(RegisterUserDto registerDto);
    Task<Result<UserViewModel>> GetUserByIdAsync(string userId);
    Task<Result<PagedResult<UserViewModel>>> GetApplicationUsersAsync(UserSearchRequest? searchRequest = null);
    Task<Result<UserViewModel>> ValidateTokenAsync(string accessToken);
    Task<Result<bool>> AssignUserToApplicationAsync(string userId);
    Task<Result<bool>> DeactivateUserAsync(string userId);
    Task<Result<bool>> ActivateUserAsync(string userId);

    // Bulk operations
    Task<Result<List<string>>> BulkActivateUsersAsync(List<string> userIds);
    Task<Result<List<string>>> BulkDeactivateUsersAsync(List<string> userIds);
}
