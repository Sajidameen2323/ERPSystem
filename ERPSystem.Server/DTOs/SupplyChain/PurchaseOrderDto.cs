using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography.X509Certificates;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.DTOs.SupplyChain;

public class PurchaseOrderDto
{
    public Guid Id { get; set; }
    public string PONumber { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public string? Status { get; set; }
    public DateTime OrderDate { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public string? SupplierName { get; set; }
    public SupplierDto? Supplier { get; set; }
    public List<PurchaseOrderItemDto> Items { get; set; } = new();
}

public class PurchaseOrderCreateDto
{
    [Required(ErrorMessage = "Supplier ID is required")]
    public Guid SupplierId { get; set; }
    
    public DateTime? ExpectedDeliveryDate { get; set; }
    
    [StringLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
    public string? Notes { get; set; }
    
    [Required(ErrorMessage = "At least one item is required")]
    [MinLength(1, ErrorMessage = "At least one item is required")]
    public List<PurchaseOrderItemCreateDto> Items { get; set; } = new();
}

public class PurchaseOrderUpdateDto
{
    public DateTime? ExpectedDeliveryDate { get; set; }
    
    [StringLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
    public string? Notes { get; set; }
    
    public List<PurchaseOrderItemUpdateDto>? Items { get; set; }
}

public class PurchaseOrderItemDto
{
    public Guid Id { get; set; }
    public Guid PurchaseOrderId { get; set; }
    public Guid ProductId { get; set; }
    public int OrderedQuantity { get; set; }
    public int ReceivedQuantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice => OrderedQuantity * UnitPrice;
    public DateTime? ReceivedDate { get; set; }
    public string? Notes { get; set; }
    
    // Navigation properties
    public string? ProductName { get; set; }
    public string? ProductSKU { get; set; }
}

public class PurchaseOrderItemCreateDto
{
    [Required(ErrorMessage = "Product ID is required")]
    public Guid ProductId { get; set; }
    
    [Required(ErrorMessage = "Ordered quantity is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Ordered quantity must be at least 1")]
    public int OrderedQuantity { get; set; }
    
    [Required(ErrorMessage = "Unit price is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
    public decimal UnitPrice { get; set; }
    
    [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
    public string? Notes { get; set; }
}

public class PurchaseOrderItemUpdateDto
{
    [Required(ErrorMessage = "Product ID is required")]
    public Guid ProductId { get; set; }
    
    [Range(1, int.MaxValue, ErrorMessage = "Ordered quantity must be at least 1")]
    public int OrderedQuantity { get; set; }
    
    [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
    public decimal UnitPrice { get; set; }
    
    [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
    public string? Notes { get; set; }
}

public class ReceiveItemDto
{
    [Required(ErrorMessage = "Received quantity is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Received quantity must be at least 1")]
    public int ReceivedQuantity { get; set; }
    
    [StringLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
    public string? Notes { get; set; }
}

public class StockMovementDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string MovementType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int StockBeforeMovement { get; set; }
    public int StockAfterMovement { get; set; }
    public string? Reference { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string MovedByUserId { get; set; } = string.Empty;
    public DateTime MovementDate { get; set; }
    public string? Notes { get; set; }
    
    // UI Helper properties
    public bool IsIncrease { get; set; }
    
    // Navigation properties
    public string? ProductName { get; set; }
    public string? ProductSKU { get; set; }
}

public class StockMovementCreateDto
{
    [Required(ErrorMessage = "Product ID is required")]
    public Guid ProductId { get; set; }
    
    [Required(ErrorMessage = "Movement type is required")]
    public StockMovementType MovementType { get; set; }
    
    [Required(ErrorMessage = "Quantity is required")]
    public int Quantity { get; set; }
    
    [StringLength(255, ErrorMessage = "Reference cannot exceed 255 characters")]
    public string? Reference { get; set; }
    
    [Required(ErrorMessage = "Reason is required")]
    [StringLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
    public string Reason { get; set; } = string.Empty;
    
    [StringLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
    public string? Notes { get; set; }
}
