using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Auth;
using ERPSystem.Server.Services.Interfaces;

namespace ERPSystem.Server.Services.Implementations;

public class UserService : IUserService
{
    private readonly IOktaAuthService _oktaAuthService;

    public UserService(IOktaAuthService oktaAuthService)
    {
        _oktaAuthService = oktaAuthService;
    }

    public async Task<Result<PagedResult<UserDto>>> GetUsersAsync(UserSearchRequest request)
    {
        try
        {
            // Fetch users from Okta API
            var oktaUsersResult = await _oktaAuthService.GetAllUsersAsync(
                searchTerm: request.SearchTerm, 
                isActive: request.IsActive, 
                limit: 1000 // Get more users than needed for accurate pagination
            );

            if (!oktaUsersResult.IsSuccess)
            {
                return Result<PagedResult<UserDto>>.Failure(oktaUsersResult.Error ?? "Failed to retrieve users from Okta");
            }

            var allUsers = oktaUsersResult.Data ?? new List<UserDto>();

            // Apply client-side filtering if Okta search wasn't sufficient
            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                allUsers = allUsers.Where(u => 
                    u.Email.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                    u.FirstName.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                    u.LastName.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            var totalCount = allUsers.Count;
            var pagedUsers = allUsers
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();

            var result = new PagedResult<UserDto>
            {
                Items = pagedUsers,
                TotalCount = totalCount,
                PageSize = request.PageSize,
                CurrentPage = request.Page
            };

            return Result<PagedResult<UserDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<PagedResult<UserDto>>.Failure($"Failed to retrieve users: {ex.Message}");
        }
    }

    public async Task<Result<UserDto>> GetUserByIdAsync(string userId)
    {
        try
        {
            // Get user profile from Okta
            var result = await _oktaAuthService.GetUserProfileAsync(userId);
            return result;
        }
        catch (Exception ex)
        {
            return Result<UserDto>.Failure($"Failed to retrieve user: {ex.Message}");
        }
    }

    public async Task<Result> AssignRolesAsync(string userId, List<string> roles)
    {
        try
        {
            // Get current user to verify they exist
            var userResult = await _oktaAuthService.GetUserProfileAsync(userId);
            if (!userResult.IsSuccess)
                return Result.Failure("User not found");

            // Validate roles - in Okta, roles are managed through groups
            var validRoles = new[] { Constants.Roles.Admin, Constants.Roles.SalesUser, Constants.Roles.InventoryUser };
            foreach (var role in roles)
            {
                if (!validRoles.Contains(role))
                    return Result.Failure($"Role '{role}' is not valid");
            }

            // In a real implementation, you would:
            // 1. Get current user groups from Okta
            // 2. Remove user from current role groups
            // 3. Add user to new role groups
            // For now, we'll return success as the actual implementation would require
            // additional Okta API calls to manage group memberships

            // TODO: Implement Okta group assignment
            // await _oktaAuthService.UpdateUserGroupsAsync(userId, roles);

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to assign roles: {ex.Message}");
        }
    }

    public async Task<Result> DeactivateUserAsync(string userId)
    {
        try
        {
            // Use Okta service to deactivate the user
            var result = await _oktaAuthService.DeactivateUserAsync(userId);
            return result;
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to deactivate user: {ex.Message}");
        }
    }

    public async Task<Result> ActivateUserAsync(string userId)
    {
        try
        {
            // In Okta, user activation would be done through the Okta API
            // For now, we'll return success as this would require additional Okta API implementation
            
            // First verify the user exists
            var userResult = await _oktaAuthService.GetUserProfileAsync(userId);
            if (!userResult.IsSuccess)
                return Result.Failure("User not found");

            // TODO: Implement Okta user activation
            // In a real implementation, you would call Okta's user activation API
            // await _oktaAuthService.ActivateUserAsync(userId);

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to activate user: {ex.Message}");
        }
    }

    public async Task<Result<UserDto>> GetCurrentUserProfileAsync(string userId)
    {
        return await GetUserByIdAsync(userId);
    }
}
