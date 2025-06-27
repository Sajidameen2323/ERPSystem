using ERPSystem.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.Server.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure ApplicationUser
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(e => e.FirstName)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.LastName)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("GETUTCDATE()");
        });

        // Seed roles
        SeedRoles(builder);
    }

    private static void SeedRoles(ModelBuilder builder)
    {
        var adminRoleId = Guid.NewGuid().ToString();
        var salesUserRoleId = Guid.NewGuid().ToString();
        var inventoryUserRoleId = Guid.NewGuid().ToString();

        builder.Entity<IdentityRole>().HasData(
            new IdentityRole
            {
                Id = adminRoleId,
                Name = Common.Constants.Roles.Admin,
                NormalizedName = Common.Constants.Roles.Admin.ToUpper(),
                ConcurrencyStamp = Guid.NewGuid().ToString()
            },
            new IdentityRole
            {
                Id = salesUserRoleId,
                Name = Common.Constants.Roles.SalesUser,
                NormalizedName = Common.Constants.Roles.SalesUser.ToUpper(),
                ConcurrencyStamp = Guid.NewGuid().ToString()
            },
            new IdentityRole
            {
                Id = inventoryUserRoleId,
                Name = Common.Constants.Roles.InventoryUser,
                NormalizedName = Common.Constants.Roles.InventoryUser.ToUpper(),
                ConcurrencyStamp = Guid.NewGuid().ToString()
            }
        );
    }
}
