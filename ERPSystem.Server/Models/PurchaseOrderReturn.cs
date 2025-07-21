using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.Models;

public enum ReturnStatus
{
    Pending = 0,
    Approved = 1,
    Processed = 2,
    Cancelled = 3
}

public enum ReturnReason
{
    Damaged = 0,
    DefectiveQuality = 1,
    WrongItem = 2,
    Excess = 3,
    NotAsOrdered = 4,
    Expired = 5,
    Other = 6
}

public class PurchaseOrderReturn
{
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string ReturnNumber { get; set; } = string.Empty;
    
    [Required]
    public Guid PurchaseOrderId { get; set; }
    
    [Required]
    public Guid SupplierId { get; set; }
    
    public ReturnStatus Status { get; set; } = ReturnStatus.Pending;
    
    public DateTime ReturnDate { get; set; } = DateTime.UtcNow;
    
    public DateTime? ProcessedDate { get; set; }
    
    public decimal TotalReturnAmount { get; set; }
    
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    [Required]
    public string CreatedByUserId { get; set; } = string.Empty; // Okta user ID
    
    public string? ApprovedByUserId { get; set; } // Okta user ID
    
    public DateTime? ApprovedAt { get; set; }
    
    public string? ProcessedByUserId { get; set; } // Okta user ID
    
    // Audit and Soft Delete
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;
    public virtual Supplier Supplier { get; set; } = null!;
    public virtual ICollection<PurchaseOrderReturnItem> Items { get; set; } = new List<PurchaseOrderReturnItem>();
}
