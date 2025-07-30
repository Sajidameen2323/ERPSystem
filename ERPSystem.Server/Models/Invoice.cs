using System.ComponentModel.DataAnnotations;

namespace ERPSystem.Server.Models;

public enum InvoiceStatus
{
    Draft = 1,
    Sent = 2,
    Paid = 3,
    PartiallyPaid = 4,
    Overdue = 5,
    Cancelled = 6,
    RefundRequested = 7,
    Refunded = 8
}

public class Invoice
{
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string InvoiceNumber { get; set; } = string.Empty;
    
    [Required]
    public Guid SalesOrderId { get; set; }
    
    [Required]
    public Guid CustomerId { get; set; }
    
    [Required]
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    
    [Required]
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    
    [Required]
    public DateTime DueDate { get; set; }
    
    [Required]
    public decimal SubTotal { get; set; }
    
    public decimal TaxAmount { get; set; }
    
    public decimal DiscountAmount { get; set; }
    
    [Required]
    public decimal TotalAmount { get; set; }
    
    public decimal PaidAmount { get; set; } = 0;
    
    public decimal BalanceAmount { get; set; }
    
    [MaxLength(1000)]
    public string? Notes { get; set; }
    
    [MaxLength(1000)]
    public string? Terms { get; set; }
    
    public DateTime? PaidDate { get; set; }
    
    // Refund tracking fields
    public decimal RefundRequestedAmount { get; set; } = 0;
    public decimal RefundedAmount { get; set; } = 0;
    public DateTime? RefundRequestedDate { get; set; }
    public DateTime? RefundedDate { get; set; }
    public string? RefundReason { get; set; }
    
    [Required]
    public string GeneratedByUserId { get; set; } = string.Empty;
    
    // Audit and Soft Delete
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual SalesOrder SalesOrder { get; set; } = null!;
    public virtual Customer Customer { get; set; } = null!;
    public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
}

public class InvoiceItem
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid InvoiceId { get; set; }
    
    [Required]
    public Guid ProductId { get; set; }
    
    [Required]
    public int Quantity { get; set; }
    
    [Required]
    public decimal UnitPrice { get; set; }
    
    [Required]
    public decimal LineTotal { get; set; }
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    // Audit and Soft Delete
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Invoice Invoice { get; set; } = null!;
    public virtual Product Product { get; set; } = null!;
}
