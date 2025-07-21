using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.Models;

public class PurchaseOrderReturnItem
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid PurchaseOrderReturnId { get; set; }
    
    [Required]
    public Guid ProductId { get; set; }
    
    [Required]
    public Guid PurchaseOrderItemId { get; set; }
    
    [Required]
    public int ReturnQuantity { get; set; }
    
    [Required]
    public decimal UnitPrice { get; set; }
    
    public decimal TotalReturnAmount { get; set; }
    
    public ReturnReason Reason { get; set; } = ReturnReason.Other;
    
    [MaxLength(500)]
    public string? ReasonDescription { get; set; }
    
    public bool RefundRequested { get; set; } = true;
    
    public bool RefundProcessed { get; set; } = false;
    
    public DateTime? RefundProcessedDate { get; set; }
    
    [MaxLength(500)]
    public string? Notes { get; set; }
    
    // Audit and Soft Delete
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual PurchaseOrderReturn PurchaseOrderReturn { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
    public virtual PurchaseOrderItem PurchaseOrderItem { get; set; } = null!;
}
