using ERPSystem.Server.Models;

namespace ERPSystem.Server.DTOs.Returns;

public class UpdatePurchaseOrderReturnStatusDto
{
    public ReturnStatus Status { get; set; }
    public string? Notes { get; set; }
}

public class ProcessPurchaseOrderReturnDto
{
    public List<ProcessReturnItemDto> Items { get; set; } = new();
    public string? Notes { get; set; }
}

public class ProcessReturnItemDto
{
    public Guid ReturnItemId { get; set; }
    public bool RefundProcessed { get; set; }
    public string? Notes { get; set; }
}
