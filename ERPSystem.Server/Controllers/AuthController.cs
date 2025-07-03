using ERPSystem.Server.DTOs.Auth;
using ERPSystem.Server.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ERPSystem.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IOktaAuthService _oktaAuthService;

    public AuthController(IOktaAuthService oktaAuthService)
    {
        _oktaAuthService = oktaAuthService;
    }

    /// <summary>
    /// Authenticate user with Okta access token
    /// </summary>
    [HttpPost("okta-login")]
    public async Task<IActionResult> OktaLogin([FromBody] OktaTokenValidationRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _oktaAuthService.AuthenticateWithOktaAsync(request.AccessToken);

        if (result.IsSuccess)
            return Ok(result);

        return BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Register a new user in Okta (Admin only)
    /// </summary>
    [HttpPost("register")]
    [Authorize(Roles = Common.Constants.Roles.Admin)]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _oktaAuthService.CreateUserAsync(registerDto);

        if (result.IsSuccess)
            return Ok(result);

        return BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userId))
            return BadRequest("User ID not found in token");

        var result = await _oktaAuthService.GetUserProfileAsync(userId);

        if (result.IsSuccess)
            return Ok(result);

        return BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Deactivate a user (Admin only)
    /// </summary>
    [HttpPost("deactivate/{userId}")]
    [Authorize(Roles = Common.Constants.Roles.Admin)]
    public async Task<IActionResult> DeactivateUser(string userId)
    {
        var result = await _oktaAuthService.DeactivateUserAsync(userId);

        if (result.IsSuccess)
            return Ok(new { message = "User deactivated successfully" });

        return BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Get user groups/roles
    /// </summary>
    [HttpGet("groups/{userId}")]
    [Authorize(Roles = Common.Constants.Roles.Admin)]
    public async Task<IActionResult> GetUserGroups(string userId)
    {
        var result = await _oktaAuthService.GetUserGroupsAsync(userId);

        if (result.IsSuccess)
            return Ok(result);

        return BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Logout current user (client-side operation with Okta)
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        // With Okta, logout is primarily handled on the client side
        // The client should revoke the token and clear the session
        return Ok(new { message = "Logout successful. Please clear your session on the client side." });
    }

    /// <summary>
    /// Exchange authorization code for access token using PKCE
    /// </summary>
    [HttpPost("okta-token-exchange")]
    public async Task<IActionResult> OktaTokenExchange([FromBody] OktaTokenExchangeRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _oktaAuthService.ExchangeCodeForTokensAsync(request);

        if (result.IsSuccess)
            return Ok(result);

        return BadRequest(new { error = result.Error });
    }
}
