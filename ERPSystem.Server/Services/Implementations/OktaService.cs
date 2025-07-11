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

    public async Task<Result<PagedResult<UserViewModel>>> GetApplicationUsersAsync(UserSearchRequest? searchRequest = null)
    {
        try
        {
            // Get all users from Okta
            var validationResult = ValidateOktaConfiguration();
            if (!validationResult.IsSuccess)
                return Result<PagedResult<UserViewModel>>.Failure(validationResult.Error);

            var client = CreateOktaApiClient();
            var requestUrl = $"{_oktaSettings.OktaDomain}/api/v1/apps/{_oktaSettings.ClientAppId}/users?expand=user";
            var response = await client.GetAsync(requestUrl);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to retrieve application users from Okta: {Error}", error);
                return Result<PagedResult<UserViewModel>>.Failure("Failed to retrieve application users from Okta");
            }

            var jsonString = await response.Content.ReadAsStringAsync();
            var contentStream = new MemoryStream(Encoding.UTF8.GetBytes(jsonString));
            var oktaUsers = await JsonSerializer.DeserializeAsync<List<OktaUserResponse>>(contentStream);

            if (oktaUsers == null)
            {
                var emptyResult = new PagedResult<UserViewModel>
                {
                    Items = new List<UserViewModel>(),
                    TotalCount = 0,
                    PageSize = 0,
                    CurrentPage = 1
                };
                return Result<PagedResult<UserViewModel>>.Success(emptyResult);
            }

            var allUsers = oktaUsers.Select(MapOktaUserToViewModel).ToList();
            
            // Apply filters if search request is provided
            var filteredUsers = allUsers.AsQueryable();

            if (searchRequest != null)
            {
                // Filter by search term (first name, last name, or email)
                if (!string.IsNullOrWhiteSpace(searchRequest.SearchTerm))
                {
                    var searchTerm = searchRequest.SearchTerm.ToLower().Trim();
                    filteredUsers = filteredUsers.Where(u =>
                        u.FirstName.ToLower().Contains(searchTerm) ||
                        u.LastName.ToLower().Contains(searchTerm) ||
                        u.Email.ToLower().Contains(searchTerm));
                }

                // Filter by active status
                if (searchRequest.IsActive.HasValue)
                {
                    filteredUsers = filteredUsers.Where(u => 
                        (u.Status != "DEPROVISIONED" && u.Status != "SUSPENDED") == searchRequest.IsActive.Value);
                }
            }

            // Get total count after filtering
            var totalCount = filteredUsers.Count();
            var allFilteredUsers = filteredUsers.ToList();

            // Return all filtered results for AG Grid to handle pagination
            var pagedResult = new PagedResult<UserViewModel>
            {
                Items = allFilteredUsers,
                TotalCount = totalCount,
                PageSize = totalCount, // Set page size to total count (all results)
                CurrentPage = 1
            };

            return Result<PagedResult<UserViewModel>>.Success(pagedResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving application users");
            return Result<PagedResult<UserViewModel>>.Failure($"Error retrieving application users: {ex.Message}");
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
            Created = oktaUser?.Created ,
            LastLoginAt = oktaUser?.Embedded?.User?.LastLogin,
            FirstName = oktaUser.Profile.GivenName,
            LastName = oktaUser.Profile.FamilyName,
            Email = oktaUser.Profile.Email,
            Roles = oktaUser.Profile.Roles
        };
    }

    public async Task<Result<List<string>>> BulkActivateUsersAsync(List<string> userIds)
    {
        try
        {
            var validationResult = ValidateOktaConfiguration();
            if (!validationResult.IsSuccess)
                return Result<List<string>>.Failure(validationResult.Error);

            if (userIds == null || !userIds.Any())
            {
                return Result<List<string>>.Failure("No user IDs provided");
            }

            var activatedUsers = new List<string>();
            var failedUsers = new List<string>();
            var errors = new List<string>();

            foreach (var userId in userIds)
            {
                if (string.IsNullOrWhiteSpace(userId))
                {
                    failedUsers.Add("Invalid ID");
                    errors.Add("Invalid user ID provided");
                    continue;
                }

                var result = await ActivateUserAsync(userId);
                if (result.IsSuccess)
                {
                    activatedUsers.Add(userId);
                    _logger.LogInformation("Successfully activated user {UserId} in bulk operation", userId);
                }
                else
                {
                    failedUsers.Add(userId);
                    errors.Add($"Failed to activate user {userId}: {result.Error}");
                    _logger.LogWarning("Failed to activate user {UserId} in bulk operation: {Error}", userId, result.Error);
                }
            }

            if (failedUsers.Any() && !activatedUsers.Any())
            {
                // All failed
                return Result<List<string>>.Failure($"Failed to activate all users. Errors: {string.Join("; ", errors)}");
            }
            else if (failedUsers.Any())
            {
                // Partial success
                var message = $"Bulk activation partially completed. Activated: {activatedUsers.Count}, Failed: {failedUsers.Count}. Errors: {string.Join("; ", errors)}";
                _logger.LogWarning("Bulk activation partially completed. Activated: {ActivatedCount}, Failed: {FailedCount}. Errors: {Errors}", 
                    activatedUsers.Count, failedUsers.Count, string.Join("; ", errors));
                return Result<List<string>>.Success(activatedUsers);
            }

            // All succeeded
            _logger.LogInformation("Bulk activation completed successfully for {Count} users", activatedUsers.Count);
            return Result<List<string>>.Success(activatedUsers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during bulk user activation");
            return Result<List<string>>.Failure($"Error during bulk activation: {ex.Message}");
        }
    }

    public async Task<Result<List<string>>> BulkDeactivateUsersAsync(List<string> userIds)
    {
        try
        {
            var validationResult = ValidateOktaConfiguration();
            if (!validationResult.IsSuccess)
                return Result<List<string>>.Failure(validationResult.Error);

            if (userIds == null || !userIds.Any())
            {
                return Result<List<string>>.Failure("No user IDs provided");
            }

            var deactivatedUsers = new List<string>();
            var failedUsers = new List<string>();
            var errors = new List<string>();

            foreach (var userId in userIds)
            {
                if (string.IsNullOrWhiteSpace(userId))
                {
                    failedUsers.Add("Invalid ID");
                    errors.Add("Invalid user ID provided");
                    continue;
                }

                var result = await DeactivateUserAsync(userId);
                if (result.IsSuccess)
                {
                    deactivatedUsers.Add(userId);
                    _logger.LogInformation("Successfully deactivated user {UserId} in bulk operation", userId);
                }
                else
                {
                    failedUsers.Add(userId);
                    errors.Add($"Failed to deactivate user {userId}: {result.Error}");
                    _logger.LogWarning("Failed to deactivate user {UserId} in bulk operation: {Error}", userId, result.Error);
                }
            }

            if (failedUsers.Any() && !deactivatedUsers.Any())
            {
                // All failed
                return Result<List<string>>.Failure($"Failed to deactivate all users. Errors: {string.Join("; ", errors)}");
            }
            else if (failedUsers.Any())
            {
                // Partial success
                var message = $"Bulk deactivation partially completed. Deactivated: {deactivatedUsers.Count}, Failed: {failedUsers.Count}. Errors: {string.Join("; ", errors)}";
                _logger.LogWarning("Bulk deactivation partially completed. Deactivated: {DeactivatedCount}, Failed: {FailedCount}. Errors: {Errors}", 
                    deactivatedUsers.Count, failedUsers.Count, string.Join("; ", errors));
                return Result<List<string>>.Success(deactivatedUsers);
            }

            // All succeeded
            _logger.LogInformation("Bulk deactivation completed successfully for {Count} users", deactivatedUsers.Count);
            return Result<List<string>>.Success(deactivatedUsers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during bulk user deactivation");
            return Result<List<string>>.Failure($"Error during bulk deactivation: {ex.Message}");
        }
    }
}
