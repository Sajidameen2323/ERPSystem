using ERPSystem.Server.Models;

namespace ERPSystem.Server.DTOs.Returns;

public class PurchaseOrderReturnDto
{
    public Guid Id { get; set; }
    public string ReturnNumber { get; set; } = string.Empty;
    public Guid PurchaseOrderId { get; set; }
    public string PurchaseOrderNumber { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public int Status { get; set; }
    public DateTime ReturnDate { get; set; }
    public DateTime? ProcessedDate { get; set; }
    public decimal TotalReturnAmount { get; set; }
    public string? Notes { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ProcessedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<PurchaseOrderReturnItemDto> Items { get; set; } = new();
}

public class PurchaseOrderReturnItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public Guid PurchaseOrderItemId { get; set; }
    public int ReturnQuantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalReturnAmount { get; set; }
    public int Reason { get; set; } 
    public string? ReasonDescription { get; set; }
    public bool RefundRequested { get; set; }
    public bool RefundProcessed { get; set; }
    public DateTime? RefundProcessedDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AvailableReturnItemDto
{
    public Guid PurchaseOrderItemId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public int OrderedQuantity { get; set; }
    public int ReceivedQuantity { get; set; }
    public int ReturnedQuantity { get; set; }
    public int AvailableForReturn { get; set; }
    public int CurrentStock { get; set; }
    public decimal UnitPrice { get; set; }
}
