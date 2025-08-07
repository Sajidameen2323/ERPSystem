using ERPSystem.Server.DTOs.Auth;
using ERPSystem.Server.Common;
using ERPSystem.Server.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ERPSystem.Server.Controllers;

[ApiController]
[Route(Constants.ApiRoutes.Users)]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IOktaService _oktaService;
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IOktaService oktaService,
        IUserService userService,
        ILogger<UsersController> logger)
    {
        _oktaService = oktaService;
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves a filtered list of users assigned to the client application
    /// </summary>
    [HttpGet]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> GetApplicationUsers([FromQuery] UserSearchRequest? searchRequest = null)
    {
        // Use default search request if none provided
        searchRequest ??= new UserSearchRequest();

        var result = await _oktaService.GetApplicationUsersAsync(searchRequest);

        if (!result.IsSuccess)
        {
            return BadRequest(Result<PagedResult<UserViewModel>>.Failure(result.Error));
        }

        return Ok(Result<PagedResult<UserViewModel>>.Success(result.Data!));
    }

    /// <summary>
    /// Get user by ID (Admin only)
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> GetUser(string id)
    {
        if (string.IsNullOrEmpty(id))
        {
            return BadRequest(Result.Failure("User ID is required"));
        }

        var result = await _oktaService.GetApplicationUserByIdAsync(id);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result.Failure(Constants.ApiMessages.UserNotFound));
            }
            return BadRequest(Result<UserViewModel>.Failure(result.Error));
        }

        return Ok(Result<UserViewModel>.Success(result.Data!));
    }

    /// <summary>
    /// Update user (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto updateDto)
    {
        if (string.IsNullOrEmpty(id))
        {
            return BadRequest(Result.Failure("User ID is required"));
        }

        // Get current user's ID from the JWT token
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        
        if (string.IsNullOrEmpty(currentUserId))
        {
            return BadRequest(Result.Failure(Constants.ApiMessages.CurrentUserIdNotFound));
        }

        // Prevent user from updating their own profile
        if (currentUserId.Equals(id, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(Result.Failure(Constants.ApiMessages.CannotUpdateOwnProfile));
        }

        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);
            return BadRequest(Result.Failure(string.Join("; ", errors)));
        }

        var result = await _oktaService.UpdateUserAsync(id, updateDto);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result.Failure(Constants.ApiMessages.UserNotFound));
            }
            return BadRequest(Result<UserViewModel>.Failure(result.Error));
        }

        return Ok(Result<UserViewModel>.Success(result.Data!));
    }

    /// <summary>
    /// Get current user's profile
    /// </summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.Identity?.Name ?? User.FindFirst("sub")?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return BadRequest(Result.Failure("User ID not found in token"));
        }

        var result = await _userService.GetCurrentUserProfileAsync(userId);

        if (!result.IsSuccess)
        {
            return BadRequest(Result<UserViewModel>.Failure(result.Error));
        }

        return Ok(Result<UserViewModel>.Success(result.Data!));
    }

    /// <summary>
    /// Get all available roles (Admin only)
    /// </summary>
    [HttpGet("roles")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> GetRoles()
    {
        var result = await _userService.GetAvailableRolesAsync();

        if (!result.IsSuccess)
        {
            return BadRequest(Result<List<string>>.Failure(result.Error));
        }

        return Ok(Result<List<string>>.Success(result.Data!));
    }

    /// <summary>
    /// Deactivate user (Admin only)
    /// </summary>
    [HttpPut("{id}/deactivate")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> DeactivateUser(string id)
    {
        if (string.IsNullOrEmpty(id))
        {
            return BadRequest(Result.Failure("User ID is required"));
        }

        var result = await _oktaService.DeactivateUserAsync(id);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result.Failure(Constants.ApiMessages.UserNotFound));
            }
            if (result.Error.Contains("already deactivated"))
            {
                return BadRequest(Result.Failure(result.Error));
            }
            return BadRequest(Result.Failure(result.Error));
        }

        return Ok(Result<string>.Success(Constants.ApiMessages.UserDeactivatedSuccessfully));
    }

    /// <summary>
    /// Activate user (Admin only)
    /// </summary>
    [HttpPut("{id}/activate")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> ActivateUser(string id)
    {
        if (string.IsNullOrEmpty(id))
        {
            return BadRequest(Result.Failure("User ID is required"));
        }

        var result = await _oktaService.ActivateUserAsync(id);

        if (!result.IsSuccess)
        {
            if (result.Error.Contains("not found"))
            {
                return NotFound(Result.Failure(Constants.ApiMessages.UserNotFound));
            }
            if (result.Error.Contains("already active"))
            {
                return BadRequest(Result.Failure(result.Error));
            }
            return BadRequest(Result.Failure(result.Error));
        }

        return Ok(Result<string>.Success(Constants.ApiMessages.UserActivatedSuccessfully));
    }

    /// <summary>
    /// Bulk activate users (Admin only)
    /// </summary>
    [HttpPut("bulk/activate")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> BulkActivateUsers([FromBody] List<string> userIds)
    {
        if (userIds == null || userIds.Count == 0)
        {
            return BadRequest(Result.Failure("User IDs are required"));
        }

        var result = await _oktaService.BulkActivateUsersAsync(userIds);

        if (!result.IsSuccess)
        {
            return BadRequest(Result.Failure(result.Error));
        }

        return Ok(Result<List<string>>.Success(result.Data!));
    }

    /// <summary>
    /// Bulk deactivate users (Admin only)
    /// </summary>
    [HttpPut("bulk/deactivate")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> BulkDeactivateUsers([FromBody] List<string> userIds)
    {
        if (userIds == null || userIds.Count == 0)
        {
            return BadRequest(Result.Failure("User IDs are required"));
        }

        var result = await _oktaService.BulkDeactivateUsersAsync(userIds);

        if (!result.IsSuccess)
        {
            return BadRequest(Result.Failure(result.Error));
        }

        return Ok(Result<List<string>>.Success(result.Data!));
    }
}
