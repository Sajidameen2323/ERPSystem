using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ERPSystem.Server.Models.Enums;

namespace ERPSystem.Server.Models;

/// <summary>
/// Represents a sales order in the ERP system
/// </summary>
public class SalesOrder
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [ForeignKey("Customer")]
    public Guid CustomerId { get; set; }

    [Required]
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;

    [Required]
    public SalesOrderStatus Status { get; set; } = SalesOrderStatus.New;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    [Range(0, double.MaxValue, ErrorMessage = "Total amount cannot be negative")]
    public decimal TotalAmount { get; set; }

    [Required]
    [StringLength(450)] // Okta user ID length
    public string OrderedByUserId { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? OrderNotes { get; set; }

    [Required]
    [StringLength(100)]
    public string ReferenceNumber { get; set; } = string.Empty;

    public DateTime? ShippedDate { get; set; }

    public DateTime? DeliveredDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;

    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual ICollection<SalesOrderItem> SalesOrderItems { get; set; } = new List<SalesOrderItem>();
    public virtual ICollection<StockReservation> StockReservations { get; set; } = new List<StockReservation>();
    public virtual Invoice? Invoice { get; set; }
}
