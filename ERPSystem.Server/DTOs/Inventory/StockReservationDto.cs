namespace ERPSystem.Server.DTOs.Inventory;

public class StockReservationDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public int ReservedQuantity { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string ReservedByUserId { get; set; } = string.Empty;
    public DateTime ReservedAt { get; set; }
    public DateTime? ReleasedAt { get; set; }
    public string? Reason { get; set; }
    public string? Notes { get; set; }
    public bool IsReleased { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ProductStockInfoDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int ReservedStock { get; set; }
    public int AvailableStock { get; set; }
    public List<StockReservationDto> ActiveReservations { get; set; } = new List<StockReservationDto>();
}
