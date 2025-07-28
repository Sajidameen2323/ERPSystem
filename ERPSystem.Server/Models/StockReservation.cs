using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.Models;

public class StockReservation
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid ProductId { get; set; }
    
    [Required]
    public Guid SalesOrderId { get; set; } // Foreign key to SalesOrder
    
    [Required]
    public int ReservedQuantity { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Reference { get; set; } = string.Empty; // Sales Order reference number (for easier lookup)
    
    [Required]
    [MaxLength(255)]
    public string ReservedByUserId { get; set; } = string.Empty; // Okta user ID
    
    [Required]
    public DateTime ReservedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ReleasedAt { get; set; }
    
    [MaxLength(500)]
    public string? Reason { get; set; }
    
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    public bool IsReleased { get; set; } = false;
    
    // Audit and Soft Delete
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Product Product { get; set; } = null!;
    public virtual SalesOrder SalesOrder { get; set; } = null!;
}
