using ERPSystem.Server.DTOs.Auth;
using ERPSystem.Server.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERPSystem.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Authenticate user and return JWT token
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.LoginAsync(loginDto);

        if (result.IsSuccess)
            return Ok(result);

        return BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Register a new user (Admin only)
    /// </summary>
    [HttpPost("register")]
    [Authorize(Roles = Common.Constants.Roles.Admin)]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.RegisterAsync(registerDto);

        if (result.IsSuccess)
            return Ok(result);

        return BadRequest(new { error = result.Error });
    }

    /// <summary>
    /// Logout current user
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var userId = User.FindFirst(Common.Constants.ClaimTypes.UserId)?.Value;
        if (string.IsNullOrEmpty(userId))
            return BadRequest("User ID not found in token");

        var result = await _authService.LogoutAsync(userId);

        if (result.IsSuccess)
            return Ok(new { message = "Logged out successfully" });

        return BadRequest(new { error = result.Error });
    }
}
