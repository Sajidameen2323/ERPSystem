using ERPSystem.Server.DTOs.Auth;
using ERPSystem.Server.Common;
using ERPSystem.Server.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ERPSystem.Server.Controllers;

[ApiController]
[Route(Constants.ApiRoutes.Auth)]
public class AuthController : ControllerBase
{
    private readonly IOktaService _oktaService;
    private readonly IUserService _userService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IOktaService oktaService,
        IUserService userService,
        ILogger<AuthController> logger)
    {
        _oktaService = oktaService;
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Registers a new user in Okta with role assignment and application access
    /// </summary>
    [HttpPost("register")]
    [Authorize(Roles = Constants.Roles.Admin)]
    public async Task<IActionResult> RegisterUser([FromBody] RegisterUserDto userDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(Result.Failure("Invalid user data provided"));
        }

        var result = await _oktaService.CreateUserAsync(userDto);

        if (!result.IsSuccess)
        {
            return BadRequest(Result.Failure(result.Error));
        }

        return CreatedAtAction(
            nameof(GetProfile), 
            new { id = result.Data!.Id }, 
            Result<UserViewModel>.Success(result.Data));
    }

    /// <summary>
    /// Validates an Okta access token and returns user information
    /// </summary>
    [HttpPost("validate-token")]
    public async Task<IActionResult> ValidateToken([FromBody] TokenValidationRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new TokenValidationResponse 
            { 
                IsValid = false, 
                Error = Constants.ApiMessages.TokenValidationFailed 
            });
        }

        var result = await _oktaService.ValidateTokenAsync(request.AccessToken);

        return Ok(new TokenValidationResponse
        {
            IsValid = result.IsSuccess,
            User = result.Data,
            Error = result.IsSuccess ? null : result.Error
        });
    }

    /// <summary>
    /// Get current user profile from authenticated token
    /// </summary>
    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            return BadRequest(Result.Failure("User ID not found in token"));
        }

        var result = await _userService.GetCurrentUserProfileAsync(userId);

        if (!result.IsSuccess)
        {
            return BadRequest(Result.Failure(result.Error));
        }

        return Ok(Result<UserViewModel>.Success(result.Data!));
    }

 
}
