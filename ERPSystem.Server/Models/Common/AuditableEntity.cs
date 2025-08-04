using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.Models.Common;

/// <summary>
/// Base entity with audit tracking capabilities
/// </summary>
public abstract class AuditableEntity
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [MaxLength(100)]
    public string CreatedBy { get; set; } = string.Empty;
    
    public DateTime? UpdatedAt { get; set; }
    
    [MaxLength(100)]
    public string? UpdatedBy { get; set; }
    
    public bool IsDeleted { get; set; } = false;
    
    public DateTime? DeletedAt { get; set; }
    
    [MaxLength(100)]
    public string? DeletedBy { get; set; }

    /// <summary>
    /// Get the entity name for audit logging
    /// </summary>
    public virtual string GetEntityName() => GetType().Name;

    /// <summary>
    /// Get the display name for audit logging
    /// </summary>
    public virtual string GetDisplayName() => GetEntityName();
}
