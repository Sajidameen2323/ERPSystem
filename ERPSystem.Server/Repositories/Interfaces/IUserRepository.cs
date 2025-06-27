using ERPSystem.Server.Models;

namespace ERPSystem.Server.Repositories.Interfaces;

public interface IUserRepository : IGenericRepository<ApplicationUser>
{
    Task<ApplicationUser?> GetByEmailAsync(string email);
    Task<IEnumerable<ApplicationUser>> GetActiveUsersAsync();
    Task<IEnumerable<ApplicationUser>> SearchUsersAsync(string? searchTerm, bool? isActive, int page, int pageSize);
    Task<int> GetUsersCountAsync(string? searchTerm, bool? isActive);
}
