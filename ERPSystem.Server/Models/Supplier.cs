using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.Models;

public class Supplier
{
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string ContactPerson { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string Country { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string? PostalCode { get; set; }
    
    [MaxLength(50)]
    public string? VatNumber { get; set; }
    
    [MaxLength(20)]
    public string? SupplierCode { get; set; }
    
    [MaxLength(100)]
    public string? PaymentTerms { get; set; }
    
    public decimal? CreditLimit { get; set; }
    
    public decimal TotalPurchases { get; set; } = 0;
    
    public int PerformanceRating { get; set; } = 0;
    
    public bool IsActive { get; set; } = true;
    
    public bool IsDeleted { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
    public virtual ICollection<ProductSupplier> ProductSuppliers { get; set; } = new List<ProductSupplier>();
}
