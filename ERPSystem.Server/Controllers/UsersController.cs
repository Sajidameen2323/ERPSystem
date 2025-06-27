using ERPSystem.Server.DTOs.Auth;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERPSystem.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Get paginated list of users (Admin only)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = Common.Constants.Roles.Admin)]
    public async Task<IActionResult> GetUsers([FromQuery] UserSearchRequest request)
    {
        var result = await _userService.GetUsersAsync(request);

        if (result.IsSuccess)
            return Ok(result);

        return BadRequest(result);
    }

    /// <summary>
    /// Get user by ID (Admin only)
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = Common.Constants.Roles.Admin)]
    public async Task<IActionResult> GetUser(string id)
    {
        var result = await _userService.GetUserByIdAsync(id);

        if (result.IsSuccess)
            return Ok(result);

        return BadRequest(result);
    }

    /// <summary>
    /// Get current user's profile
    /// </summary>
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirst(Common.Constants.ClaimTypes.UserId)?.Value;
        if (string.IsNullOrEmpty(userId))
            return BadRequest(Result.Failure("User ID not found in token"));

        var result = await _userService.GetCurrentUserProfileAsync(userId);

        if (result.IsSuccess)
            return Ok(result);

        return BadRequest(result);
    }

    /// <summary>
    /// Get all available roles (Admin only)
    /// </summary>
    [HttpGet("roles")]
    [Authorize(Roles = Common.Constants.Roles.Admin)]
    public IActionResult GetRoles()
    {
        var roles = new List<string>
        {
            Common.Constants.Roles.Admin,
            Common.Constants.Roles.SalesUser,
            Common.Constants.Roles.InventoryUser
        };
        
        return Ok(Result<List<string>>.Success(roles));
    }

    /// <summary>
    /// Assign roles to user (Admin only)
    /// </summary>
    [HttpPut("{id}/roles")]
    [Authorize(Roles = Common.Constants.Roles.Admin)]
    public async Task<IActionResult> AssignRoles(string id, [FromBody] AssignRolesDto assignRolesDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(Result.Failure("Invalid model state"));

        var result = await _userService.AssignRolesAsync(id, assignRolesDto.Roles);

        if (result.IsSuccess)
            return Ok(Result.Success());

        return BadRequest(result);
    }

    /// <summary>
    /// Deactivate user (Admin only)
    /// </summary>
    [HttpPut("{id}/deactivate")]
    [Authorize(Roles = Common.Constants.Roles.Admin)]
    public async Task<IActionResult> DeactivateUser(string id)
    {
        var result = await _userService.DeactivateUserAsync(id);

        if (result.IsSuccess)
            return Ok(Result.Success());

        return BadRequest(result);
    }

    /// <summary>
    /// Activate user (Admin only)
    /// </summary>
    [HttpPut("{id}/activate")]
    [Authorize(Roles = Common.Constants.Roles.Admin)]
    public async Task<IActionResult> ActivateUser(string id)
    {
        var result = await _userService.ActivateUserAsync(id);

        if (result.IsSuccess)
            return Ok(Result.Success());

        return BadRequest(result);
    }
}
