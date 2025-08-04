using ERPSystem.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Security.Claims;
using System.Text.Json;

namespace ERPSystem.Server.Data.Interceptors;

/// <summary>
/// Interceptor for automatic audit logging of entity changes
/// </summary>
public class AuditInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AuditInterceptor> _logger;

    public AuditInterceptor(
        IHttpContextAccessor httpContextAccessor,
        ILogger<AuditInterceptor> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        ProcessAudit(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, 
        InterceptionResult<int> result, 
        CancellationToken cancellationToken = default)
    {
        await ProcessAuditAsync(eventData.Context);
        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void ProcessAudit(DbContext? context)
    {
        if (context == null) return;
        
        _ = Task.Run(async () => await ProcessAuditAsync(context));
    }

    private async Task ProcessAuditAsync(DbContext? context)
    {
        if (context == null) return;

        try
        {
            var auditEntries = new List<AuditEntry>();

            foreach (var entry in context.ChangeTracker.Entries())
            {
                // Skip audit logs themselves to prevent infinite loops
                if (entry.Entity is AuditLog)
                    continue;

                // Skip entities that are not being tracked for auditing
                if (entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                    continue;

                var auditEntry = CreateAuditEntry(entry);
                if (auditEntry != null)
                {
                    auditEntries.Add(auditEntry);
                }
            }

            // Save audit entries directly to database after the main save
            if (auditEntries.Any())
            {
                await SaveAuditEntriesAsync(context, auditEntries);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing audit entries");
        }
    }

    private async Task SaveAuditEntriesAsync(DbContext context, List<AuditEntry> auditEntries)
    {
        try
        {
            // Create a new context instance to avoid tracking conflicts
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            optionsBuilder.UseSqlServer(context.Database.GetConnectionString());
            
            using var auditContext = new ApplicationDbContext(optionsBuilder.Options);
            
            foreach (var auditEntry in auditEntries)
            {
                // Get final entity ID after save (for new entities)
                if (string.IsNullOrEmpty(auditEntry.EntityId))
                {
                    auditEntry.EntityId = GetEntityId(auditEntry.Entry);
                }

                var auditLog = CreateAuditLog(auditEntry);
                auditContext.AuditLogs.Add(auditLog);
            }

            await auditContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving audit entries to database");
        }
    }

    private AuditLog CreateAuditLog(AuditEntry auditEntry)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var userId = httpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
        var userName = httpContext?.User?.FindFirst(ClaimTypes.Name)?.Value ?? 
                      httpContext?.User?.FindFirst("name")?.Value ?? "System";
        var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();
        var userAgent = httpContext?.Request?.Headers["User-Agent"].ToString();
        string? sessionId = null;
        try
        {
            sessionId = httpContext?.Session?.Id;
        }
        catch (InvalidOperationException)
        {
            // Session not configured, use a default value
            sessionId = "no-session";
        }

        var title = GenerateTitle(auditEntry);
        var description = GenerateDescription(auditEntry);
        var severity = DetermineSeverity(auditEntry.ActivityType);
        var icon = GetActivityIcon(auditEntry.ActivityType, auditEntry.EntityName);

        return new AuditLog
        {
            ActivityType = auditEntry.ActivityType,
            EntityType = auditEntry.EntityName,
            EntityId = auditEntry.EntityId,
            UserId = userId,
            UserName = userName,
            Title = title,
            Description = description,
            OldValues = auditEntry.OldValues != null ? JsonSerializer.Serialize(auditEntry.OldValues) : null,
            NewValues = auditEntry.NewValues != null ? JsonSerializer.Serialize(auditEntry.NewValues) : null,
            Timestamp = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Severity = severity,
            Icon = icon,
            SessionId = sessionId
        };
    }

    private AuditEntry? CreateAuditEntry(EntityEntry entry)
    {
        var entityName = entry.Entity.GetType().Name;
        var entityId = GetEntityId(entry);

        return entry.State switch
        {
            EntityState.Added => new AuditEntry
            {
                EntityName = entityName,
                EntityId = entityId,
                ActivityType = "Create",
                NewValues = GetEntityValues(entry, EntityState.Added),
                Entry = entry
            },
            EntityState.Modified => new AuditEntry
            {
                EntityName = entityName,
                EntityId = entityId,
                ActivityType = "Update",
                OldValues = GetEntityValues(entry, EntityState.Modified, useOriginalValues: true),
                NewValues = GetEntityValues(entry, EntityState.Modified),
                Entry = entry
            },
            EntityState.Deleted => new AuditEntry
            {
                EntityName = entityName,
                EntityId = entityId,
                ActivityType = "Delete",
                OldValues = GetEntityValues(entry, EntityState.Deleted, useOriginalValues: true),
                Entry = entry
            },
            _ => null
        };
    }

    private string? GetEntityId(EntityEntry entry)
    {
        try
        {
            var keyName = entry.Metadata.FindPrimaryKey()?.Properties.FirstOrDefault()?.Name;
            if (keyName != null)
            {
                var value = entry.Property(keyName).CurrentValue;
                return value?.ToString();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not determine entity ID for {EntityType}", entry.Entity.GetType().Name);
        }
        return null;
    }

    private object? GetEntityValues(EntityEntry entry, EntityState state, bool useOriginalValues = false)
    {
        try
        {
            var values = new Dictionary<string, object?>();

            foreach (var property in entry.Properties)
            {
                // Skip sensitive properties
                if (IsSensitiveProperty(property.Metadata.Name))
                    continue;

                var value = useOriginalValues ? property.OriginalValue : property.CurrentValue;
                
                if (state == EntityState.Modified && property.IsModified)
                {
                    values[property.Metadata.Name] = value;
                }
                else if (state == EntityState.Added || state == EntityState.Deleted)
                {
                    values[property.Metadata.Name] = value;
                }
            }

            return values.Any() ? values : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not serialize entity values for {EntityType}", entry.Entity.GetType().Name);
            return null;
        }
    }

    private static bool IsSensitiveProperty(string propertyName)
    {
        var sensitiveProperties = new[]
        {
            "password", "token", "secret", "key", "hash", "salt"
        };

        return sensitiveProperties.Any(prop => 
            propertyName.Contains(prop, StringComparison.OrdinalIgnoreCase));
    }

    private string GenerateTitle(AuditEntry auditEntry)
    {
        var displayName = GetEntityDisplayName(auditEntry.EntityName);
        
        return auditEntry.ActivityType switch
        {
            "Create" => $"New {displayName} created",
            "Update" => $"{displayName} updated",
            "Delete" => $"{displayName} deleted",
            _ => $"{displayName} {auditEntry.ActivityType.ToLower()}ed"
        };
    }

    private string GenerateDescription(AuditEntry auditEntry)
    {
        var displayName = GetEntityDisplayName(auditEntry.EntityName);
        var entityRef = !string.IsNullOrEmpty(auditEntry.EntityId) 
            ? $"{displayName} (ID: {auditEntry.EntityId})" 
            : displayName;

        return auditEntry.ActivityType switch
        {
            "Create" => $"A new {entityRef} was created in the system",
            "Update" => $"{entityRef} was modified",
            "Delete" => $"{entityRef} was removed from the system",
            _ => $"{entityRef} was {auditEntry.ActivityType.ToLower()}ed"
        };
    }

    private static string GetEntityDisplayName(string entityName)
    {
        return entityName switch
        {
            "Customer" => "customer",
            "Product" => "product",
            "SalesOrder" => "sales order",
            "PurchaseOrder" => "purchase order",
            "Invoice" => "invoice",
            "Supplier" => "supplier",
            "StockMovement" => "stock movement",
            "StockAdjustment" => "stock adjustment",
            "SalesOrderItem" => "sales order item",
            "PurchaseOrderItem" => "purchase order item",
            "InvoiceItem" => "invoice item",
            _ => entityName.ToLower()
        };
    }

    private static string DetermineSeverity(string activityType)
    {
        return activityType switch
        {
            "Delete" => "Warning",
            "Create" => "Success",
            "Update" => "Info",
            _ => "Info"
        };
    }

    private static string GetActivityIcon(string activityType, string entityName)
    {
        // First check activity type
        var icon = activityType switch
        {
            "Create" => "Plus",
            "Update" => "Edit",
            "Delete" => "Trash2",
            _ => "Activity"
        };

        // Override with entity-specific icons for create operations
        if (activityType == "Create")
        {
            icon = entityName switch
            {
                "Customer" => "UserPlus",
                "Product" => "Package",
                "SalesOrder" => "ShoppingCart",
                "PurchaseOrder" => "ShoppingBag",
                "Invoice" => "FileText",
                "Supplier" => "Truck",
                "StockMovement" => "ArrowUpDown",
                "StockAdjustment" => "RefreshCw",
                _ => "Plus"
            };
        }

        return icon;
    }

    private class AuditEntry
    {
        public string EntityName { get; set; } = string.Empty;
        public string? EntityId { get; set; }
        public string ActivityType { get; set; } = string.Empty;
        public object? OldValues { get; set; }
        public object? NewValues { get; set; }
        public EntityEntry Entry { get; set; } = null!;
    }
}
