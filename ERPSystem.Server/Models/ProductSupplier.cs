using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.Models;

public class ProductSupplier
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid ProductId { get; set; }
    
    [Required]
    public Guid SupplierId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string SupplierSKU { get; set; } = string.Empty;
    
    [Required]
    public decimal SupplierPrice { get; set; }
    
    public int MinimumOrderQuantity { get; set; } = 1;
    
    public int LeadTimeDays { get; set; } = 0;
    
    public bool IsPreferredSupplier { get; set; } = false;
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Product Product { get; set; } = null!;
    public virtual Supplier Supplier { get; set; } = null!;
}
