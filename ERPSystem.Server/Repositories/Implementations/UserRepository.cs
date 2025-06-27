using ERPSystem.Server.Data;
using ERPSystem.Server.Models;
using ERPSystem.Server.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.Server.Repositories.Implementations;

public class UserRepository : GenericRepository<ApplicationUser>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }    
    public async Task<ApplicationUser?> GetByEmailAsync(string email)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Email != null && u.Email == email);
    }

    public async Task<IEnumerable<ApplicationUser>> GetActiveUsersAsync()
    {
        return await _dbSet.Where(u => u.IsActive).ToListAsync();
    }

    public async Task<IEnumerable<ApplicationUser>> SearchUsersAsync(string? searchTerm, bool? isActive, int page, int pageSize)
    {
        var query = _dbSet.AsQueryable();        
        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(u => 
                (u.Email != null && u.Email.Contains(searchTerm)) ||
                u.FirstName.Contains(searchTerm) ||
                u.LastName.Contains(searchTerm));
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        return await query
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetUsersCountAsync(string? searchTerm, bool? isActive)
    {
        var query = _dbSet.AsQueryable();        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(u => 
                (u.Email != null && u.Email.Contains(searchTerm)) ||
                u.FirstName.Contains(searchTerm) ||
                u.LastName.Contains(searchTerm));
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        return await query.CountAsync();
    }
}
