using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Auth;
using ERPSystem.Server.Services.Interfaces;

namespace ERPSystem.Server.Services.Implementations;

public class UserService : IUserService
{
    private readonly IOktaService _oktaService;
    private readonly ILogger<UserService> _logger;

    public UserService(IOktaService oktaService, ILogger<UserService> logger)
    {
        _oktaService = oktaService;
        _logger = logger;
    }

    public async Task<Result<UserViewModel>> GetCurrentUserProfileAsync(string userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return Result<UserViewModel>.Failure("User ID is required");
        }

        try
        {
            return await _oktaService.GetUserByIdAsync(userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile for {UserId}", userId);
            return Result<UserViewModel>.Failure($"Failed to get user profile: {ex.Message}");
        }
    }

    public Task<Result<List<string>>> GetAvailableRolesAsync()
    {
        try
        {
            var roles = new List<string>
            {
                Constants.Roles.Admin,
                Constants.Roles.SalesUser,
                Constants.Roles.InventoryUser
            };

            return Task.FromResult(Result<List<string>>.Success(roles));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available roles");
            return Task.FromResult(Result<List<string>>.Failure($"Failed to get available roles: {ex.Message}"));
        }
    }
}
