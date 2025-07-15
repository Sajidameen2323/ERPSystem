using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.Models;

public enum StockMovementType
{
    StockIn = 1,        // Stock received from supplier
    StockOut = 2,       // Stock sold to customer
    Adjustment = 3,     // Manual stock adjustment
    Transfer = 4,       // Stock transfer between locations
    Damaged = 5,        // Stock marked as damaged
    Expired = 6,        // Stock marked as expired
    Return = 7          // Stock returned from customer
}

public class StockMovement
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid ProductId { get; set; }
    
    [Required]
    public StockMovementType MovementType { get; set; }
    
    [Required]
    public int Quantity { get; set; } // Positive for inbound, negative for outbound
    
    public int StockBeforeMovement { get; set; }
    
    public int StockAfterMovement { get; set; }
    
    [MaxLength(255)]
    public string? Reference { get; set; } // PO Number, Sale Number, etc.
    
    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;
    
    [Required]
    public string MovedByUserId { get; set; } = string.Empty; // Okta user ID
    
    public DateTime MovementDate { get; set; } = DateTime.UtcNow;
    
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    // Audit and Soft Delete (Critical for audit trail)
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Product Product { get; set; } = null!;
}
