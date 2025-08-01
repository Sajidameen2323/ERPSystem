namespace ERPSystem.Server.DTOs.Dashboard;

/// <summary>
/// Comprehensive dashboard overview containing all key metrics
/// </summary>
public class DashboardOverviewDto
{
    public SalesMetricsDto SalesMetrics { get; set; } = new();
    public InventoryMetricsDto InventoryMetrics { get; set; } = new();
    public FinancialMetricsDto FinancialMetrics { get; set; } = new();
    public CustomerMetricsDto CustomerMetrics { get; set; } = new();
    public SystemMetricsDto SystemMetrics { get; set; } = new();
    public DateRangeDto DateRange { get; set; } = new();
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Sales performance metrics
/// </summary>
public class SalesMetricsDto
{
    public decimal TotalSales { get; set; }
    public int TotalOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
    public int CompletedOrders { get; set; }
    public int PendingOrders { get; set; }
    public int CancelledOrders { get; set; }
    public decimal SalesGrowth { get; set; }
    public List<TopCustomerDto> TopCustomers { get; set; } = new();
    public List<RecentOrderDto> RecentOrders { get; set; } = new();
}

/// <summary>
/// Inventory management metrics
/// </summary>
public class InventoryMetricsDto
{
    public int TotalProducts { get; set; }
    public int LowStockItems { get; set; }
    public int OutOfStockItems { get; set; }
    public decimal TotalInventoryValue { get; set; }
    public List<LowStockAlertDto> LowStockAlerts { get; set; } = new();
    public List<TopProductDto> TopProducts { get; set; } = new();
}

/// <summary>
/// Financial performance metrics
/// </summary>
public class FinancialMetricsDto
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalOutstanding { get; set; }
    public decimal TotalOverdue { get; set; }
    public int AveragePaymentDays { get; set; }
    public List<PaymentTrendDto> PaymentTrends { get; set; } = new();
    public CashFlowDto CashFlow { get; set; } = new();
}

/// <summary>
/// Customer engagement metrics
/// </summary>
public class CustomerMetricsDto
{
    public int TotalCustomers { get; set; }
    public int NewCustomers { get; set; }
    public int ActiveCustomers { get; set; }
    public decimal CustomerRetentionRate { get; set; }
    public decimal AverageCustomerValue { get; set; }
}

/// <summary>
/// System health and performance metrics
/// </summary>
public class SystemMetricsDto
{
    public int ActiveUsers { get; set; }
    public string SystemHealth { get; set; } = "Unknown";
    public DateTime LastBackup { get; set; }
    public List<PendingTaskDto> PendingTasks { get; set; } = new();
    public List<SystemAlertDto> SystemAlerts { get; set; } = new();
}

/// <summary>
/// Recent system activity
/// </summary>
public class RecentActivityDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Icon { get; set; } = string.Empty;
    public string Severity { get; set; } = "info";
    public string UserId { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Dictionary<string, object>? Metadata { get; set; }
}

/// <summary>
/// Top customer by revenue
/// </summary>
public class TopCustomerDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int TotalOrders { get; set; }
    public decimal TotalSpent { get; set; }
    public DateTime LastOrderDate { get; set; }
    public string? Avatar { get; set; }
}

/// <summary>
/// Top product by sales
/// </summary>
public class TopProductDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int TotalSold { get; set; }
    public decimal Revenue { get; set; }
    public int CurrentStock { get; set; }
    public string? Image { get; set; }
}

/// <summary>
/// Low stock alert information
/// </summary>
public class LowStockAlertDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int MinimumStock { get; set; }
    public int ReorderLevel { get; set; }
    public bool IsCritical { get; set; }
}

/// <summary>
/// Recent order summary
/// </summary>
public class RecentOrderDto
{
    public string Id { get; set; } = string.Empty;
    public string ReferenceNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int Status { get; set; }
    public DateTime OrderDate { get; set; }
}

/// <summary>
/// Payment trend data
/// </summary>
public class PaymentTrendDto
{
    public string Period { get; set; } = string.Empty;
    public decimal TotalPaid { get; set; }
    public decimal TotalOutstanding { get; set; }
    public decimal TotalOverdue { get; set; }
}

/// <summary>
/// Cash flow summary
/// </summary>
public class CashFlowDto
{
    public decimal Income { get; set; }
    public decimal Expenses { get; set; }
    public decimal Net { get; set; }
}

/// <summary>
/// Pending task information
/// </summary>
public class PendingTaskDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "medium";
    public DateTime DueDate { get; set; }
    public string AssignedTo { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}

/// <summary>
/// System alert information
/// </summary>
public class SystemAlertDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool Resolved { get; set; }
}

/// <summary>
/// Chart data for dashboard visualizations
/// </summary>
public class ChartDataDto
{
    public List<string> Labels { get; set; } = new();
    public List<ChartDatasetDto> Datasets { get; set; } = new();
}

/// <summary>
/// Chart dataset information
/// </summary>
public class ChartDatasetDto
{
    public string Label { get; set; } = string.Empty;
    public List<decimal> Data { get; set; } = new();
    public string? BackgroundColor { get; set; }
    public string? BorderColor { get; set; }
    public int BorderWidth { get; set; } = 1;
    public bool Fill { get; set; }
    public decimal Tension { get; set; } = 0.1m;
}

/// <summary>
/// Date range filter
/// </summary>
public class DateRangeDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
}

/// <summary>
/// Live metric with trend information
/// </summary>
public class LiveMetricDto
{
    public string Key { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public decimal PreviousValue { get; set; }
    public string Trend { get; set; } = "stable";
    public decimal ChangePercent { get; set; }
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// Dashboard widget configuration
/// </summary>
public class DashboardWidgetDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Size { get; set; } = "md";
    public WidgetPositionDto Position { get; set; } = new();
    public WidgetConfigDto Config { get; set; } = new();
    public bool Visible { get; set; } = true;
    public bool Refreshable { get; set; } = true;
}

/// <summary>
/// Widget position information
/// </summary>
public class WidgetPositionDto
{
    public int Row { get; set; }
    public int Column { get; set; }
}

/// <summary>
/// Widget configuration options
/// </summary>
public class WidgetConfigDto
{
    public bool ShowHeader { get; set; } = true;
    public bool ShowFooter { get; set; } = false;
    public bool AllowExpand { get; set; } = true;
    public bool AutoRefresh { get; set; } = false;
    public int RefreshInterval { get; set; } = 300; // seconds
    public Dictionary<string, string>? CustomStyles { get; set; }
    public string? DataSource { get; set; }
    public Dictionary<string, object>? ChartOptions { get; set; }
}
