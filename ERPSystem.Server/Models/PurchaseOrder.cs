using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.Models;

public enum PurchaseOrderStatus
{
    Draft = 0,
    Pending = 1,
    Approved = 2,
    Sent = 3,
    PartiallyReceived = 4,
    Received = 5,
    Cancelled = 6
}

public class PurchaseOrder
{
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string PONumber { get; set; } = string.Empty;
    
    [Required]
    public Guid SupplierId { get; set; }
    
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    
    public DateTime? ExpectedDeliveryDate { get; set; }
    
    public DateTime? ActualDeliveryDate { get; set; }
    
    public decimal TotalAmount { get; set; }
    
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    [Required]
    public string CreatedByUserId { get; set; } = string.Empty; // Okta user ID
    
    public string? ApprovedByUserId { get; set; } // Okta user ID
    
    public DateTime? ApprovedAt { get; set; }
    
    public bool IsDeleted { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Supplier Supplier { get; set; } = null!;
    public virtual ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
}
