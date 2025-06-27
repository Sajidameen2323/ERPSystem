using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Auth;
using ERPSystem.Server.Models;
using ERPSystem.Server.Repositories.Interfaces;
using ERPSystem.Server.Services.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace ERPSystem.Server.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IUnitOfWork _unitOfWork;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtTokenService jwtTokenService,
        IUnitOfWork unitOfWork)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtTokenService = jwtTokenService;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<LoginResponse>> LoginAsync(LoginDto loginDto)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user == null)
                return Result<LoginResponse>.Failure("Invalid email or password");

            if (!user.IsActive)
                return Result<LoginResponse>.Failure("Account is deactivated. Please contact administrator");

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
            if (!result.Succeeded)
                return Result<LoginResponse>.Failure("Invalid email or password");

            var token = await _jwtTokenService.GenerateTokenAsync(user.Id);
            var roles = await _userManager.GetRolesAsync(user);

            var response = new LoginResponse
            {
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(24), // Should match JWT expiration
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    FullName = user.FullName,
                    IsActive = user.IsActive,
                    Roles = roles.ToList(),
                    CreatedAt = user.CreatedAt
                }
            };

            return Result<LoginResponse>.Success(response);
        }
        catch (Exception ex)
        {
            return Result<LoginResponse>.Failure($"Login failed: {ex.Message}");
        }
    }

    public async Task<Result<UserDto>> RegisterAsync(RegisterDto registerDto)
    {
        try
        {
            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(registerDto.Email);
            if (existingUser != null)
                return Result<UserDto>.Failure("User with this email already exists");

            // Create new user
            var user = new ApplicationUser
            {
                UserName = registerDto.Email,
                Email = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                return Result<UserDto>.Failure($"User creation failed: {errors}");
            }

            // Assign roles if provided
            if (registerDto.Roles.Any())
            {
                var roleResult = await _userManager.AddToRolesAsync(user, registerDto.Roles);
                if (!roleResult.Succeeded)
                {
                    // Log warning but don't fail the registration
                    // In production, you might want to handle this differently
                }
            }

            var userRoles = await _userManager.GetRolesAsync(user);
            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                IsActive = user.IsActive,
                Roles = userRoles.ToList(),
                CreatedAt = user.CreatedAt
            };

            return Result<UserDto>.Success(userDto);
        }
        catch (Exception ex)
        {
            return Result<UserDto>.Failure($"Registration failed: {ex.Message}");
        }
    }

    public async Task<Result> LogoutAsync(string userId)
    {
        try
        {
            await _signInManager.SignOutAsync();
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"Logout failed: {ex.Message}");
        }
    }
}
