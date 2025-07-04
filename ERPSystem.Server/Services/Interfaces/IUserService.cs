using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Auth;

namespace ERPSystem.Server.Services.Interfaces;

public interface IUserService
{
    Task<Result<UserViewModel>> GetCurrentUserProfileAsync(string userId);
    Task<Result<List<string>>> GetAvailableRolesAsync();
}
