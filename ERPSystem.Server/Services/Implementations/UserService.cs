using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Auth;
using ERPSystem.Server.Models;
using ERPSystem.Server.Repositories.Interfaces;
using ERPSystem.Server.Services.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace ERPSystem.Server.Services.Implementations;

public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IUnitOfWork _unitOfWork;

    public UserService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IUnitOfWork unitOfWork)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<PagedResult<UserDto>>> GetUsersAsync(UserSearchRequest request)
    {
        try
        {
            var users = await _unitOfWork.Users.SearchUsersAsync(
                request.SearchTerm,
                request.IsActive,
                request.Page,
                request.PageSize);

            var totalCount = await _unitOfWork.Users.GetUsersCountAsync(
                request.SearchTerm,
                request.IsActive);

            var userDtos = new List<UserDto>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userDtos.Add(new UserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    FullName = user.FullName,
                    IsActive = user.IsActive,
                    Roles = roles.ToList(),
                    CreatedAt = user.CreatedAt
                });
            }

            var result = new PagedResult<UserDto>
            {
                Items = userDtos,
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
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Result<UserDto>.Failure("User not found");

            var roles = await _userManager.GetRolesAsync(user);
            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                IsActive = user.IsActive,
                Roles = roles.ToList(),
                CreatedAt = user.CreatedAt
            };

            return Result<UserDto>.Success(userDto);
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
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Result.Failure("User not found");

            // Validate that all roles exist
            foreach (var roleName in roles)
            {
                var roleExists = await _roleManager.RoleExistsAsync(roleName);
                if (!roleExists)
                    return Result.Failure($"Role '{roleName}' does not exist");
            }

            // Remove current roles
            var currentRoles = await _userManager.GetRolesAsync(user);
            if (currentRoles.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                {
                    var errors = string.Join(", ", removeResult.Errors.Select(e => e.Description));
                    return Result.Failure($"Failed to remove current roles: {errors}");
                }
            }

            // Add new roles
            if (roles.Any())
            {
                var addResult = await _userManager.AddToRolesAsync(user, roles);
                if (!addResult.Succeeded)
                {
                    var errors = string.Join(", ", addResult.Errors.Select(e => e.Description));
                    return Result.Failure($"Failed to assign roles: {errors}");
                }
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

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
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Result.Failure("User not found");

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return Result.Failure($"Failed to deactivate user: {errors}");
            }

            return Result.Success();
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
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Result.Failure("User not found");

            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return Result.Failure($"Failed to activate user: {errors}");
            }

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
