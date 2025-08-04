using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPSystem.Server.Models;

/// <summary>
/// Audit log entity for tracking all system activities
/// </summary>
public class AuditLog
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Type of activity (Create, Update, Delete, Login, etc.)
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string ActivityType { get; set; } = string.Empty;

    /// <summary>
    /// Entity type that was affected (Customer, Product, Order, etc.)
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string EntityType { get; set; } = string.Empty;

    /// <summary>
    /// ID of the entity that was affected
    /// </summary>
    [MaxLength(50)]
    public string? EntityId { get; set; }

    /// <summary>
    /// User ID who performed the action
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Username of the user who performed the action
    /// </summary>
    [MaxLength(255)]
    public string? UserName { get; set; }

    /// <summary>
    /// Human-readable title of the activity
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Detailed description of the activity
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// JSON representation of the old values (for updates)
    /// </summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? OldValues { get; set; }

    /// <summary>
    /// JSON representation of the new values (for creates/updates)
    /// </summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? NewValues { get; set; }

    /// <summary>
    /// Timestamp when the activity occurred
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// IP address of the user who performed the action
    /// </summary>
    [MaxLength(45)]
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent information
    /// </summary>
    [MaxLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Severity level of the activity (Info, Warning, Error, Critical)
    /// </summary>
    [MaxLength(20)]
    public string Severity { get; set; } = "Info";

    /// <summary>
    /// Icon to display for this activity type
    /// </summary>
    [MaxLength(50)]
    public string? Icon { get; set; }

    /// <summary>
    /// Additional metadata in JSON format
    /// </summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? Metadata { get; set; }

    /// <summary>
    /// Whether this audit log has been archived
    /// </summary>
    public bool IsArchived { get; set; } = false;

    /// <summary>
    /// Session ID for tracking user sessions
    /// </summary>
    [MaxLength(100)]
    public string? SessionId { get; set; }
}
