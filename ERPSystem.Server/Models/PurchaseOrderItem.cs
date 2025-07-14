using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.Models;

public class PurchaseOrderItem
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid PurchaseOrderId { get; set; }
    
    [Required]
    public Guid ProductId { get; set; }
    
    [Required]
    public int OrderedQuantity { get; set; }
    
    public int ReceivedQuantity { get; set; } = 0;
    
    [Required]
    public decimal UnitPrice { get; set; }
    
    public decimal TotalPrice => OrderedQuantity * UnitPrice;
    
    public DateTime? ReceivedDate { get; set; }
    
    [MaxLength(500)]
    public string? Notes { get; set; }
    
    // Navigation properties
    public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
}
