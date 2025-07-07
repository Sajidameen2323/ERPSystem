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
    /// Retrieves a list of all users assigned to the client application
    /// </summary>
    [HttpGet]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> GetApplicationUsers()
    {
        var result = await _oktaService.GetApplicationUsersAsync();

        if (!result.IsSuccess)
        {
            return BadRequest(Result<List<UserViewModel>>.Failure(result.Error));
        }

        return Ok(Result<List<UserViewModel>>.Success(result.Data!));
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

        var result = await _oktaService.GetUserByIdAsync(id);

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
}
