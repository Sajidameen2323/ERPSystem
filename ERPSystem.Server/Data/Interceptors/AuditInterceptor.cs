using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Models.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace ERPSystem.Server.Data.Interceptors;

/// <summary>
/// Interceptor for automatic audit logging of entity changes
/// </summary>
public class AuditInterceptor : SaveChangesInterceptor
{
    private readonly IAuditService _auditService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AuditInterceptor> _logger;

    public AuditInterceptor(
        IAuditService auditService, 
        IHttpContextAccessor httpContextAccessor,
        ILogger<AuditInterceptor> logger)
    {
        _auditService = auditService;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        if (eventData.Context != null)
        {
            _ = Task.Run(async () => await ProcessAuditAsync(eventData.Context));
        }
        return base.SavingChanges(eventData, result);
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, 
        InterceptionResult<int> result, 
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context != null)
        {
            await ProcessAuditAsync(eventData.Context);
        }
        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private async Task ProcessAuditAsync(DbContext context)
    {
        try
        {
            var auditEntries = new List<AuditEntry>();

            foreach (var entry in context.ChangeTracker.Entries())
            {
                // Skip audit logs themselves to prevent infinite loops
                if (entry.Entity.GetType().Name == "AuditLog")
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

            // Process audit entries after save to get generated IDs
            if (auditEntries.Any())
            {
                foreach (var auditEntry in auditEntries)
                {
                    await ProcessAuditEntryAsync(auditEntry);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing audit entries");
        }
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

    private async Task ProcessAuditEntryAsync(AuditEntry auditEntry)
    {
        try
        {
            // Get entity ID after save (for new entities)
            if (string.IsNullOrEmpty(auditEntry.EntityId))
            {
                auditEntry.EntityId = GetEntityId(auditEntry.Entry);
            }

            var title = GenerateTitle(auditEntry);
            var description = GenerateDescription(auditEntry);
            var severity = DetermineSeverity(auditEntry.ActivityType);
            var icon = GetActivityIcon(auditEntry.ActivityType, auditEntry.EntityName);

            await _auditService.LogActivityAsync(
                activityType: auditEntry.ActivityType,
                entityType: auditEntry.EntityName,
                entityId: auditEntry.EntityId,
                title: title,
                description: description,
                oldValues: auditEntry.OldValues,
                newValues: auditEntry.NewValues,
                severity: severity,
                icon: icon
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing audit entry for {EntityName}", auditEntry.EntityName);
        }
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
