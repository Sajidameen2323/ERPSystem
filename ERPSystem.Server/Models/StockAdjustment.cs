using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.Models;

public class StockAdjustment
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid ProductId { get; set; }
    
    [Required]
    public int AdjustmentQuantity { get; set; } // Positive for add, negative for deduct
    
    [Required]
    [MaxLength(255)]
    public string Reason { get; set; } = string.Empty;
    
    [Required]
    public string AdjustedByUserId { get; set; } = string.Empty; // Okta user ID
    
    public DateTime AdjustedAt { get; set; } = DateTime.UtcNow;
    
    // Audit and Soft Delete
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Product Product { get; set; } = null!;
}
