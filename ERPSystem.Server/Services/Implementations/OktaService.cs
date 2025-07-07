using ERPSystem.Server.Configuration;
using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Auth;
using ERPSystem.Server.Services.Interfaces;
using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;

namespace ERPSystem.Server.Services.Implementations;

public class OktaService : IOktaService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly OktaSettings _oktaSettings;
    private readonly ILogger<OktaService> _logger;

    public OktaService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IOptions<OktaSettings> oktaSettings,
        ILogger<OktaService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _oktaSettings = oktaSettings.Value;
        _logger = logger;
    }

    public async Task<Result<UserViewModel>> CreateUserAsync(RegisterUserDto registerDto)
    {
        try
        {
            var validationResult = ValidateOktaConfiguration();
            if (!validationResult.IsSuccess)
                return Result<UserViewModel>.Failure(validationResult.Error);

            var client = CreateOktaApiClient();

            // Create user in Okta
            var createUserRequest = new
            {
                profile = new
                {
                    firstName = registerDto.FirstName,
                    lastName = registerDto.LastName,
                    email = registerDto.Email,
                    login = registerDto.Email,
                    roles = registerDto.Roles ?? Array.Empty<string>()
                },
                credentials = new
                {
                    password = new { value = registerDto.Password }
                },
                groupIds = registerDto.GroupIds ?? Array.Empty<string>()
            };

            var jsonPayload = JsonSerializer.Serialize(createUserRequest);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            var createUserResponse = await client.PostAsync(
                $"{_oktaSettings.OktaDomain}/api/v1/users?activate=true", 
                content);

            if (!createUserResponse.IsSuccessStatusCode)
            {
                var error = await createUserResponse.Content.ReadAsStringAsync();
                _logger.LogError("Failed to create user in Okta: {Error}", error);
                return Result<UserViewModel>.Failure("Failed to create user in Okta");
            }

            var createdUser = JsonSerializer.Deserialize<OktaUserResponse>(
                await createUserResponse.Content.ReadAsStringAsync());

            if (createdUser == null || string.IsNullOrEmpty(createdUser.Id))
            {
                return Result<UserViewModel>.Failure("Failed to deserialize Okta user response");
            }

            // Assign user to application
            var assignResult = await AssignUserToApplicationAsync(createdUser.Id);
            if (!assignResult.IsSuccess)
            {
                _logger.LogWarning("User created but failed to assign to application: {UserId}", createdUser.Id);
            }

            var userViewModel = MapOktaUserToViewModel(createdUser);
            return Result<UserViewModel>.Success(userViewModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return Result<UserViewModel>.Failure($"Error creating user: {ex.Message}");
        }
    }

    public async Task<Result<UserViewModel>> GetUserByIdAsync(string userId)
    {
        try
        {
            var validationResult = ValidateOktaConfiguration();
            if (!validationResult.IsSuccess)
                return Result<UserViewModel>.Failure(validationResult.Error);

            var client = CreateOktaApiClient();
            var response = await client.GetAsync($"{_oktaSettings.OktaDomain}/api/v1/users/{userId}");

            if (!response.IsSuccessStatusCode)
            {
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return Result<UserViewModel>.Failure("User not found");
                }

                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to retrieve user from Okta: {Error}", error);
                return Result<UserViewModel>.Failure("Failed to retrieve user from Okta");
            }

            var userJson = await response.Content.ReadAsStringAsync();
            var oktaUser = JsonSerializer.Deserialize<OktaUserResponse>(userJson);

            if (oktaUser == null)
            {
                return Result<UserViewModel>.Failure("Failed to deserialize user response");
            }

            var userViewModel = MapOktaUserToViewModel(oktaUser);
            return Result<UserViewModel>.Success(userViewModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user {UserId}", userId);
            return Result<UserViewModel>.Failure($"Error retrieving user: {ex.Message}");
        }
    }

    public async Task<Result<List<UserViewModel>>> GetApplicationUsersAsync()
    {
        try
        {
            var validationResult = ValidateOktaConfiguration();
            if (!validationResult.IsSuccess)
                return Result<List<UserViewModel>>.Failure(validationResult.Error);

            var client = CreateOktaApiClient();
            var requestUrl = $"{_oktaSettings.OktaDomain}/api/v1/apps/{_oktaSettings.ClientAppId}/users?expand=user";
            var response = await client.GetAsync(requestUrl);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to retrieve application users from Okta: {Error}", error);
                return Result<List<UserViewModel>>.Failure("Failed to retrieve application users from Okta");
            }

            var jsonString = await response.Content.ReadAsStringAsync();

            var contentStream = new MemoryStream(Encoding.UTF8.GetBytes(jsonString));
            var oktaUsers = await JsonSerializer.DeserializeAsync<List<OktaUserResponse>>(contentStream);

            if (oktaUsers == null)
            {
                return Result<List<UserViewModel>>.Success(new List<UserViewModel>());
            }

            var userViewModels = oktaUsers.Select(MapOktaUserToViewModel).ToList();
            return Result<List<UserViewModel>>.Success(userViewModels);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving application users");
            return Result<List<UserViewModel>>.Failure($"Error retrieving application users: {ex.Message}");
        }
    }

    public async Task<Result<UserViewModel>> ValidateTokenAsync(string accessToken)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");

            var authorizationServerId = _configuration["Okta:AuthorizationServerId"];
            var userInfoResponse = await client.GetAsync(
                $"{_oktaSettings.OktaDomain}/oauth2/{authorizationServerId}/v1/userinfo");

            if (!userInfoResponse.IsSuccessStatusCode)
            {
                return Result<UserViewModel>.Failure("Invalid or expired access token");
            }

            var userInfoJson = await userInfoResponse.Content.ReadAsStringAsync();
            var userInfo = JsonSerializer.Deserialize<JsonElement>(userInfoJson);

            var userId = userInfo.GetProperty("sub").GetString() ?? string.Empty;
            var email = userInfo.GetProperty("email").GetString() ?? string.Empty;
            var firstName = userInfo.TryGetProperty("given_name", out var givenName) 
                ? givenName.GetString() ?? string.Empty : string.Empty;
            var lastName = userInfo.TryGetProperty("family_name", out var familyName) 
                ? familyName.GetString() ?? string.Empty : string.Empty;

            // Get detailed user information including roles
            var userDetailResult = await GetUserByIdAsync(userId);
            string[]? roles = null;

            if (userDetailResult.IsSuccess && userDetailResult.Data != null)
            {
                roles = userDetailResult.Data.Roles;
            }

            var user = new UserViewModel
            {
                Id = userId,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                Status = "ACTIVE",
                Created = DateTime.UtcNow,
                Roles = roles
            };

            return Result<UserViewModel>.Success(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating token");
            return Result<UserViewModel>.Failure($"Token validation failed: {ex.Message}");
        }
    }

    public async Task<Result<bool>> AssignUserToApplicationAsync(string userId)
    {
        try
        {
            var client = CreateOktaApiClient();
            
            var assignUserPayload = new
            {
                id = userId,
                scope = "USER",
                credentials = new
                {
                    userName = userId
                }
            };

            var assignUserJson = JsonSerializer.Serialize(assignUserPayload);
            var assignUserContent = new StringContent(assignUserJson, Encoding.UTF8, "application/json");
            var assignToAppResponse = await client.PostAsync(
                $"{_oktaSettings.OktaDomain}/api/v1/apps/{_oktaSettings.ClientId}/users", 
                assignUserContent);

            if (!assignToAppResponse.IsSuccessStatusCode)
            {
                var error = await assignToAppResponse.Content.ReadAsStringAsync();
                _logger.LogError("Failed to assign user to application: {Error}", error);
                return Result<bool>.Failure("Failed to assign user to application");
            }

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning user {UserId} to application", userId);
            return Result<bool>.Failure($"Error assigning user to application: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeactivateUserAsync(string userId)
    {
        try
        {
            var validationResult = ValidateOktaConfiguration();
            if (!validationResult.IsSuccess)
                return Result<bool>.Failure(validationResult.Error);

            var client = CreateOktaApiClient();

            // First, check if user exists and get current status
            var getUserResponse = await client.GetAsync($"{_oktaSettings.OktaDomain}/api/v1/users/{userId}");
            
            if (!getUserResponse.IsSuccessStatusCode)
            {
                if (getUserResponse.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return Result<bool>.Failure(Constants.ApiMessages.UserNotFound);
                }
                
                var error = await getUserResponse.Content.ReadAsStringAsync();
                _logger.LogError("Failed to get user {UserId}: {Error}", userId, error);
                return Result<bool>.Failure("Failed to retrieve user information");
            }

            var userJson = await getUserResponse.Content.ReadAsStringAsync();
            var userResponse = JsonSerializer.Deserialize<OktaUserResponse>(userJson, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            // Check if user is already deactivated
            if (userResponse?.Status?.ToLower() == "suspended" || userResponse?.Status?.ToLower() == "deprovisioned")
            {
                return Result<bool>.Failure(Constants.ApiMessages.UserAlreadyDeactivated);
            }

            // Deactivate the user (suspend in Okta)
            var deactivateResponse = await client.PostAsync(
                $"{_oktaSettings.OktaDomain}/api/v1/users/{userId}/lifecycle/suspend", 
                null);

            if (!deactivateResponse.IsSuccessStatusCode)
            {
                var error = await deactivateResponse.Content.ReadAsStringAsync();
                _logger.LogError("Failed to deactivate user {UserId}: {Error}", userId, error);
                return Result<bool>.Failure("Failed to deactivate user");
            }

            _logger.LogInformation("User {UserId} deactivated successfully", userId);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating user {UserId}", userId);
            return Result<bool>.Failure($"Error deactivating user: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ActivateUserAsync(string userId)
    {
        try
        {
            var validationResult = ValidateOktaConfiguration();
            if (!validationResult.IsSuccess)
                return Result<bool>.Failure(validationResult.Error);

            var client = CreateOktaApiClient();

            // First, check if user exists and get current status
            var getUserResponse = await client.GetAsync($"{_oktaSettings.OktaDomain}/api/v1/users/{userId}");
            
            if (!getUserResponse.IsSuccessStatusCode)
            {
                if (getUserResponse.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return Result<bool>.Failure(Constants.ApiMessages.UserNotFound);
                }
                
                var error = await getUserResponse.Content.ReadAsStringAsync();
                _logger.LogError("Failed to get user {UserId}: {Error}", userId, error);
                return Result<bool>.Failure("Failed to retrieve user information");
            }

            var userJson = await getUserResponse.Content.ReadAsStringAsync();
            var userResponse = JsonSerializer.Deserialize<OktaUserResponse>(userJson, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            // Check if user is already active
            if (userResponse?.Status?.ToLower() == "active")
            {
                return Result<bool>.Failure(Constants.ApiMessages.UserAlreadyActive);
            }

            // Check if user is in a state that can be activated
            if (userResponse?.Status?.ToLower() != "suspended")
            {
                return Result<bool>.Failure($"User cannot be activated from current status: {userResponse?.Status}");
            }

            // Activate the user (unsuspend in Okta)
            var activateResponse = await client.PostAsync(
                $"{_oktaSettings.OktaDomain}/api/v1/users/{userId}/lifecycle/unsuspend", 
                null);

            if (!activateResponse.IsSuccessStatusCode)
            {
                var error = await activateResponse.Content.ReadAsStringAsync();
                _logger.LogError("Failed to activate user {UserId}: {Error}", userId, error);
                return Result<bool>.Failure("Failed to activate user");
            }

            _logger.LogInformation("User {UserId} activated successfully", userId);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating user {UserId}", userId);
            return Result<bool>.Failure($"Error activating user: {ex.Message}");
        }
    }

    private HttpClient CreateOktaApiClient()
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", $"SSWS {_oktaSettings.ApiToken}");
        return client;
    }

    private Result ValidateOktaConfiguration()
    {
        if (string.IsNullOrEmpty(_oktaSettings.OktaDomain) ||
            string.IsNullOrEmpty(_oktaSettings.ApiToken) ||
            string.IsNullOrEmpty(_oktaSettings.ClientId))
        {
            return Result.Failure("Okta configuration is incomplete");
        }

        return Result.Success();
    }

    private static UserViewModel MapOktaUserToViewModel(OktaUserResponse oktaUser)
    {
        return new UserViewModel
        {
            Id = oktaUser.Id,
            Status = oktaUser?.Embedded?.User?.Status ?? "N/A",
            Created = oktaUser.Created ,
            FirstName = oktaUser.Profile.GivenName,
            LastName = oktaUser.Profile.FamilyName,
            Email = oktaUser.Profile.Email,
            Roles = oktaUser.Profile.Roles
        };
    }
}
