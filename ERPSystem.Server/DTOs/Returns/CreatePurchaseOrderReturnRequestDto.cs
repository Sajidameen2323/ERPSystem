using ERPSystem.Server.Models;

namespace ERPSystem.Server.DTOs.Returns;

public class CreatePurchaseOrderReturnRequestDto
{
    public Guid PurchaseOrderId { get; set; }
    public Guid SupplierId { get; set; }
    public string? Notes { get; set; }
    public List<CreatePurchaseOrderReturnItemDto> Items { get; set; } = new();
}

public class CreatePurchaseOrderReturnItemDto
{
    public Guid ProductId { get; set; }
    public Guid PurchaseOrderItemId { get; set; }
    public int ReturnQuantity { get; set; }
    public decimal UnitPrice { get; set; }
    public ReturnReason Reason { get; set; }
    public string? ReasonDescription { get; set; }
    public bool RefundRequested { get; set; } = true;
    public string? Notes { get; set; }
}
