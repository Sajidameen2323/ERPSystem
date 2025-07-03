using ERPSystem.Server.Common;
using ERPSystem.Server.Configuration;
using ERPSystem.Server.DTOs.Auth;
using ERPSystem.Server.Services.Interfaces;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text.Json;

namespace ERPSystem.Server.Services.Implementations;

public class OktaAuthService : IOktaAuthService
{
    private readonly OktaSettings _oktaSettings;
    private readonly HttpClient _httpClient;

    public OktaAuthService(IOptions<OktaSettings> oktaSettings, HttpClient httpClient)
    {
        _oktaSettings = oktaSettings.Value;
        _httpClient = httpClient;
    }

    public async Task<Result<OktaLoginResponse>> AuthenticateWithOktaAsync(string accessToken)
    {
        try
        {
            // Validate the access token with Okta's introspection endpoint
            var introspectionResult = await IntrospectTokenAsync(accessToken);
            if (!introspectionResult.IsSuccess || introspectionResult.Data == null)
            {
                return Result<OktaLoginResponse>.Failure("Invalid or expired access token");
            }

            var tokenInfo = introspectionResult.Data;
            if (!tokenInfo.Active)
            {
                return Result<OktaLoginResponse>.Failure("Token is not active");
            }

            // Get user profile from Okta
            var userResult = await GetUserProfileAsync(tokenInfo.Sub);
            if (!userResult.IsSuccess || userResult.Data == null)
            {
                return Result<OktaLoginResponse>.Failure("Failed to retrieve user profile");
            }

            // Get user groups for role mapping
            var groupsResult = await GetUserGroupsAsync(tokenInfo.Sub);
            var groups = groupsResult.IsSuccess ? groupsResult.Data ?? new List<string>() : new List<string>();

            var response = new OktaLoginResponse
            {
                AccessToken = accessToken,
                User = userResult.Data,
                ExpiresAt = DateTimeOffset.FromUnixTimeSeconds(tokenInfo.Exp).DateTime,
                Groups = groups
            };

            return Result<OktaLoginResponse>.Success(response);
        }
        catch (Exception ex)
        {
            return Result<OktaLoginResponse>.Failure($"Authentication failed: {ex.Message}");
        }
    }

    public async Task<Result<OktaLoginResponse>> ExchangeCodeForTokensAsync(OktaTokenExchangeRequest request)
    {
        try
        {
            // Prepare the token exchange request
            var tokenRequestBody = new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["client_id"] = _oktaSettings.ClientId,
                ["code"] = request.Code,
                ["code_verifier"] = request.CodeVerifier,
                ["redirect_uri"] = request.RedirectUri
            };

            var tokenEndpoint = $"{_oktaSettings.OktaDomain}/oauth2/{_oktaSettings.AuthorizationServerId}/v1/token";
            
            var formContent = new FormUrlEncodedContent(tokenRequestBody);
            var response = await _httpClient.PostAsync(tokenEndpoint, formContent);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return Result<OktaLoginResponse>.Failure($"Token exchange failed: {errorContent}");
            }

            var jsonResponse = await response.Content.ReadAsStringAsync();
            var tokenResponse = JsonSerializer.Deserialize<OktaTokenResponse>(jsonResponse, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.AccessToken))
            {
                return Result<OktaLoginResponse>.Failure("Invalid token response from Okta");
            }

            // Now authenticate with the received access token
            return await AuthenticateWithOktaAsync(tokenResponse.AccessToken);
        }
        catch (Exception ex)
        {
            return Result<OktaLoginResponse>.Failure($"Token exchange failed: {ex.Message}");
        }
    }

    public async Task<Result<UserDto>> GetUserProfileAsync(string userId)
    {
        try
        {
            var url = $"{_oktaSettings.OktaDomain}/api/v1/users/{userId}";
            var request = new HttpRequestMessage(System.Net.Http.HttpMethod.Get, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("SSWS", _oktaSettings.ApiToken);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var oktaUser = JsonSerializer.Deserialize<OktaUserResponse>(content, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            if (oktaUser == null)
            {
                return Result<UserDto>.Failure("User not found");
            }

            var userDto = new UserDto
            {
                Id = oktaUser.Id,
                Email = oktaUser.Profile.Email ?? string.Empty,
                FirstName = oktaUser.Profile.FirstName ?? string.Empty,
                LastName = oktaUser.Profile.LastName ?? string.Empty,
                IsActive = oktaUser.Status == "ACTIVE",
                CreatedAt = oktaUser.Created,
                Roles = await MapGroupsToRoles(userId)
            };

            return Result<UserDto>.Success(userDto);
        }
        catch (Exception ex)
        {
            return Result<UserDto>.Failure($"Failed to get user profile: {ex.Message}");
        }
    }

    public async Task<Result<UserDto>> CreateUserAsync(RegisterDto registerDto)
    {
        try
        {
            var url = $"{_oktaSettings.OktaDomain}/api/v1/users?activate=true";
            var request = new HttpRequestMessage(System.Net.Http.HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("SSWS", _oktaSettings.ApiToken);

            var createUserPayload = new
            {
                profile = new
                {
                    firstName = registerDto.FirstName,
                    lastName = registerDto.LastName,
                    email = registerDto.Email,
                    login = registerDto.Email
                },
                credentials = new
                {
                    password = new { value = registerDto.Password }
                }
            };

            var jsonContent = JsonSerializer.Serialize(createUserPayload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            request.Content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var oktaUser = JsonSerializer.Deserialize<OktaUserResponse>(content, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            if (oktaUser == null)
            {
                return Result<UserDto>.Failure("Failed to create user");
            }

            // Assign user to groups based on roles
            if (registerDto.Roles.Any())
            {
                await AssignUserToGroupsAsync(oktaUser.Id, registerDto.Roles);
            }

            var userDto = new UserDto
            {
                Id = oktaUser.Id,
                Email = oktaUser.Profile.Email ?? string.Empty,
                FirstName = oktaUser.Profile.FirstName ?? string.Empty,
                LastName = oktaUser.Profile.LastName ?? string.Empty,
                IsActive = oktaUser.Status == "ACTIVE",
                CreatedAt = oktaUser.Created,
                Roles = registerDto.Roles
            };

            return Result<UserDto>.Success(userDto);
        }
        catch (Exception ex)
        {
            return Result<UserDto>.Failure($"Failed to create user: {ex.Message}");
        }
    }

    public async Task<Result> DeactivateUserAsync(string userId)
    {
        try
        {
            var url = $"{_oktaSettings.OktaDomain}/api/v1/users/{userId}/lifecycle/deactivate";
            var request = new HttpRequestMessage(System.Net.Http.HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("SSWS", _oktaSettings.ApiToken);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to deactivate user: {ex.Message}");
        }
    }

    public async Task<Result<List<string>>> GetUserGroupsAsync(string userId)
    {
        try
        {
            var url = $"{_oktaSettings.OktaDomain}/api/v1/users/{userId}/groups";
            var request = new HttpRequestMessage(System.Net.Http.HttpMethod.Get, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("SSWS", _oktaSettings.ApiToken);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var groups = JsonSerializer.Deserialize<List<OktaGroupResponse>>(content, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var groupNames = groups?.Select(g => g.Profile.Name).ToList() ?? new List<string>();
            return Result<List<string>>.Success(groupNames);
        }
        catch (Exception ex)
        {
            return Result<List<string>>.Failure($"Failed to get user groups: {ex.Message}");
        }
    }

    public async Task<Result<List<UserDto>>> GetAllUsersAsync(string? searchTerm = null, bool? isActive = null, int limit = 200)
    {
        try
        {
            var url = $"{_oktaSettings.OktaDomain}/api/v1/users?limit={limit}";
            
            // Add search query if provided
            if (!string.IsNullOrEmpty(searchTerm))
            {
                url += $"&q={Uri.EscapeDataString(searchTerm)}";
            }

            // Add filter for active/inactive users
            if (isActive.HasValue)
            {
                var statusFilter = isActive.Value ? "ACTIVE" : "DEPROVISIONED";
                url += $"&filter=status eq \"{statusFilter}\"";
            }

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("SSWS", _oktaSettings.ApiToken);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var oktaUsers = JsonSerializer.Deserialize<List<OktaUserResponse>>(content, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            if (oktaUsers == null)
            {
                return Result<List<UserDto>>.Success(new List<UserDto>());
            }

            var userDtos = new List<UserDto>();
            
            // For better performance, we could batch the group requests
            // For now, we'll keep it simple but add some parallelization
            var userTasks = oktaUsers.Select(async oktaUser =>
            {
                return new UserDto
                {
                    Id = oktaUser.Id,
                    Email = oktaUser.Profile.Email ?? string.Empty,
                    FirstName = oktaUser.Profile.FirstName ?? string.Empty,
                    LastName = oktaUser.Profile.LastName ?? string.Empty,
                    IsActive = oktaUser.Status == "ACTIVE",
                    CreatedAt = oktaUser.Created,
                    Roles = await MapGroupsToRoles(oktaUser.Id)
                };
            });

            userDtos = (await Task.WhenAll(userTasks)).ToList();

            return Result<List<UserDto>>.Success(userDtos);
        }
        catch (Exception ex)
        {
            return Result<List<UserDto>>.Failure($"Failed to retrieve users from Okta: {ex.Message}");
        }
    }

    private async Task<Result<TokenIntrospectionResponse>> IntrospectTokenAsync(string accessToken)
    {
        try
        {
            var introspectionEndpoint = $"{_oktaSettings.OktaDomain}/oauth2/{_oktaSettings.AuthorizationServerId}/v1/introspect";
            
            var request = new HttpRequestMessage(HttpMethod.Post, introspectionEndpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _oktaSettings.ApiToken);
            
            var formContent = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("token", accessToken),
                new KeyValuePair<string, string>("token_type_hint", "access_token")
            });
            
            request.Content = formContent;
            
            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
            
            var responseContent = await response.Content.ReadAsStringAsync();
            var introspectionResponse = JsonSerializer.Deserialize<TokenIntrospectionResponse>(responseContent, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });

            return Result<TokenIntrospectionResponse>.Success(introspectionResponse!);
        }
        catch (Exception ex)
        {
            return Result<TokenIntrospectionResponse>.Failure($"Token introspection failed: {ex.Message}");
        }
    }

    private async Task<List<string>> MapGroupsToRoles(string userId)
    {
        try
        {
            var groupsResult = await GetUserGroupsAsync(userId);
            if (!groupsResult.IsSuccess || groupsResult.Data == null)
            {
                return new List<string>();
            }

            var roles = new List<string>();
            foreach (var groupName in groupsResult.Data)
            {
                // Map Okta groups to application roles
                var role = groupName?.ToLower() switch
                {
                    "erp-admin" or "administrators" => Constants.Roles.Admin,
                    "erp-sales" or "sales" => Constants.Roles.SalesUser,
                    "erp-inventory" or "inventory" => Constants.Roles.InventoryUser,
                    _ => null
                };

                if (!string.IsNullOrEmpty(role) && !roles.Contains(role))
                {
                    roles.Add(role);
                }
            }

            return roles;
        }
        catch
        {
            return new List<string>();
        }
    }

    private async Task AssignUserToGroupsAsync(string userId, List<string> roles)
    {
        try
        {
            // First, get all groups to find the correct group IDs
            var allGroupsUrl = $"{_oktaSettings.OktaDomain}/api/v1/groups";
            var request = new HttpRequestMessage(System.Net.Http.HttpMethod.Get, allGroupsUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("SSWS", _oktaSettings.ApiToken);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var allGroups = JsonSerializer.Deserialize<List<OktaGroupResponse>>(content, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            if (allGroups == null) return;

            foreach (var role in roles)
            {
                var groupName = role.ToLower() switch
                {
                    var r when r == Constants.Roles.Admin.ToLower() => "erp-admin",
                    var r when r == Constants.Roles.SalesUser.ToLower() => "erp-sales",
                    var r when r == Constants.Roles.InventoryUser.ToLower() => "erp-inventory",
                    _ => null
                };

                if (!string.IsNullOrEmpty(groupName))
                {
                    var group = allGroups.FirstOrDefault(g => g.Profile.Name?.ToLower() == groupName);
                    if (group != null)
                    {
                        // Add user to group
                        var addToGroupUrl = $"{_oktaSettings.OktaDomain}/api/v1/groups/{group.Id}/users/{userId}";
                        var addRequest = new HttpRequestMessage(System.Net.Http.HttpMethod.Put, addToGroupUrl);
                        addRequest.Headers.Authorization = new AuthenticationHeaderValue("SSWS", _oktaSettings.ApiToken);
                        
                        await _httpClient.SendAsync(addRequest);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            // Log the error but don't fail the user creation
            Console.WriteLine($"Failed to assign user to groups: {ex.Message}");
        }
    }
}

public class TokenIntrospectionResponse
{
    public bool Active { get; set; }
    public string Sub { get; set; } = string.Empty;
    public string Aud { get; set; } = string.Empty;
    public string Iss { get; set; } = string.Empty;
    public long Exp { get; set; }
    public long Iat { get; set; }
    public string Scope { get; set; } = string.Empty;
}

// Response classes for Okta API
public class OktaUserResponse
{
    public string Id { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime Created { get; set; }
    public OktaProfileResponse Profile { get; set; } = new();
}

public class OktaProfileResponse
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class OktaGroupResponse
{
    public string Id { get; set; } = string.Empty;
    public OktaProfileResponse Profile { get; set; } = new();
}
