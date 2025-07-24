using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ERPSystem.Server.Models;

/// <summary>
/// Represents an individual line item within a sales order
/// </summary>
public class SalesOrderItem
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [ForeignKey("SalesOrder")]
    public Guid SalesOrderId { get; set; }

    [Required]
    [ForeignKey("Product")]
    public Guid ProductId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
    public int Quantity { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
    public decimal UnitPriceAtTimeOfOrder { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal LineTotal { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    // Audit and Soft Delete (Critical for financial records)
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual SalesOrder SalesOrder { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
}
