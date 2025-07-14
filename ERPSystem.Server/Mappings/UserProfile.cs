using AutoMapper;
using ERPSystem.Server.DTOs.Auth;

namespace ERPSystem.Server.Mappings;

public class UserProfile : Profile
{
    public UserProfile()
    {
        // Since user management is handled by Okta, we only need basic DTO mappings
        // No ApplicationUser entity mappings needed
    }
}
