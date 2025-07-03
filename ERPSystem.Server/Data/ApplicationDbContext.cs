using Microsoft.EntityFrameworkCore;

namespace ERPSystem.Server.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Add your entity configurations here as needed
        // Since users are managed in Okta, we don't need user-related configurations
    }
}
