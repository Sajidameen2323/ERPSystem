using System.ComponentModel.DataAnnotations;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.DTOs.Sales;

/// <summary>
/// DTO for displaying invoice information
/// </summary>
public class InvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid SalesOrderId { get; set; }
    public string SalesOrderReferenceNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public InvoiceStatus Status { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string? Notes { get; set; }
    public string? Terms { get; set; }
    public DateTime? PaidDate { get; set; }
    public string GeneratedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public List<InvoiceItemDto> InvoiceItems { get; set; } = new();
}

/// <summary>
/// DTO for creating a new invoice
/// </summary>
public class InvoiceCreateDto
{
    [Required(ErrorMessage = "Sales Order ID is required")]
    public Guid SalesOrderId { get; set; }

    [Required(ErrorMessage = "Due date is required")]
    public DateTime DueDate { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Tax amount cannot be negative")]
    public decimal TaxAmount { get; set; } = 0;

    [Range(0, double.MaxValue, ErrorMessage = "Discount amount cannot be negative")]
    public decimal DiscountAmount { get; set; } = 0;

    [StringLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
    public string? Notes { get; set; }

    [StringLength(1000, ErrorMessage = "Terms cannot exceed 1000 characters")]
    public string? Terms { get; set; }

    [Required(ErrorMessage = "Invoice items are required")]
    [MinLength(1, ErrorMessage = "At least one invoice item is required")]
    public List<InvoiceItemCreateDto> InvoiceItems { get; set; } = new();
}

/// <summary>
/// DTO for updating an existing invoice
/// </summary>
public class InvoiceUpdateDto
{
    [Required(ErrorMessage = "Due date is required")]
    public DateTime DueDate { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Tax amount cannot be negative")]
    public decimal TaxAmount { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Discount amount cannot be negative")]
    public decimal DiscountAmount { get; set; }

    [StringLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
    public string? Notes { get; set; }

    [StringLength(1000, ErrorMessage = "Terms cannot exceed 1000 characters")]
    public string? Terms { get; set; }

    [Required(ErrorMessage = "Invoice items are required")]
    [MinLength(1, ErrorMessage = "At least one invoice item is required")]
    public List<InvoiceItemUpdateDto> InvoiceItems { get; set; } = new();
}

/// <summary>
/// DTO for updating invoice status
/// </summary>
public class InvoiceStatusUpdateDto
{
    [Required(ErrorMessage = "Status is required")]
    public InvoiceStatus Status { get; set; }

    public DateTime? PaidDate { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Paid amount cannot be negative")]
    public decimal? PaidAmount { get; set; }
}

/// <summary>
/// DTO for invoice payment
/// </summary>
public class InvoicePaymentDto
{
    [Required(ErrorMessage = "Payment amount is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Payment amount must be greater than 0")]
    public decimal PaymentAmount { get; set; }

    [Required(ErrorMessage = "Payment date is required")]
    public DateTime PaymentDate { get; set; }

    [StringLength(500, ErrorMessage = "Payment notes cannot exceed 500 characters")]
    public string? PaymentNotes { get; set; }
}

/// <summary>
/// DTO for invoice item display
/// </summary>
public class InvoiceItemDto
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
}

/// <summary>
/// DTO for creating invoice items
/// </summary>
public class InvoiceItemCreateDto
{
    [Required(ErrorMessage = "Product ID is required")]
    public Guid ProductId { get; set; }

    [Required(ErrorMessage = "Quantity is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
    public int Quantity { get; set; }

    [Required(ErrorMessage = "Unit price is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
    public decimal UnitPrice { get; set; }

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }
}

/// <summary>
/// DTO for updating invoice items
/// </summary>
public class InvoiceItemUpdateDto
{
    public Guid? Id { get; set; } // Null for new items

    [Required(ErrorMessage = "Product ID is required")]
    public Guid ProductId { get; set; }

    [Required(ErrorMessage = "Quantity is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
    public int Quantity { get; set; }

    [Required(ErrorMessage = "Unit price is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
    public decimal UnitPrice { get; set; }

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }
}

/// <summary>
/// Query parameters for filtering invoices
/// </summary>
public class InvoiceQueryParameters
{
    public Guid? CustomerId { get; set; }
    public Guid? SalesOrderId { get; set; }
    public InvoiceStatus? Status { get; set; }
    public DateTime? InvoiceDateFrom { get; set; }
    public DateTime? InvoiceDateTo { get; set; }
    public DateTime? DueDateFrom { get; set; }
    public DateTime? DueDateTo { get; set; }
    public string? InvoiceNumber { get; set; }
    public string? CustomerName { get; set; }
    public bool? IsOverdue { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; } = "InvoiceDate";
    public bool SortDescending { get; set; } = true;
}
