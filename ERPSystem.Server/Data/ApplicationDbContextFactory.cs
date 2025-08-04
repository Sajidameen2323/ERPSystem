using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ERPSystem.Server.Data;

/// <summary>
/// Design-time factory for ApplicationDbContext to support Entity Framework migrations
/// </summary>
public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        
        // Use a default connection string for migrations
        var connectionString = "Server=(localdb)\\mssqllocaldb;Database=ERPSystemDb;Trusted_Connection=true;MultipleActiveResultSets=true";
        
        optionsBuilder.UseSqlServer(connectionString);

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
