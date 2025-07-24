using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Returns;
using ERPSystem.Server.Models;

namespace ERPSystem.Server.Services.Interfaces;

public interface IPurchaseOrderReturnService
{
    Task<PagedResult<PurchaseOrderReturnDto>> GetReturnsAsync(
        int page = 1,
        int pageSize = 10,
        string? search = null,
        ReturnStatus? status = null,
        DateTime? dateFrom = null,
        DateTime? dateTo = null);

    Task<Result<PurchaseOrderReturnDto>> GetReturnByIdAsync(Guid id);

    Task<Result<List<PurchaseOrderReturnDto>>> GetReturnsByPurchaseOrderIdAsync(Guid purchaseOrderId);

    Task<Result<PurchaseOrderReturnDto>> CreateReturnAsync(CreatePurchaseOrderReturnRequestDto request, string userId);

    Task<Result<PurchaseOrderReturnDto>> ApproveReturnAsync(Guid id, ApproveReturnDto request, string userId);

    Task<Result<PurchaseOrderReturnDto>> CancelReturnAsync(Guid id, CancelReturnDto request, string userId);

    Task<Result<PurchaseOrderReturnDto>> ProcessReturnAsync(Guid id, ProcessPurchaseOrderReturnDto request, string userId);

    Task<Result<List<AvailableReturnItemDto>>> GetAvailableReturnItemsAsync(Guid purchaseOrderId);

    Task<string> GenerateReturnNumberAsync();
}
