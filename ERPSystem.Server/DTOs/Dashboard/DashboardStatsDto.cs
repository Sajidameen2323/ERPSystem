namespace ERPSystem.Server.DTOs.Dashboard
{
    public class DashboardStatsDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int TotalProducts { get; set; }
        public int LowStockProducts { get; set; }
        public int TotalCustomers { get; set; }
        public int TotalSalesOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalRevenueThisMonth { get; set; }
        public List<DashboardChartDataDto> SalesChartData { get; set; } = new();
        public List<DashboardChartDataDto> InventoryChartData { get; set; } = new();
        public List<RecentActivityDto> RecentActivities { get; set; } = new();
        public List<TopProductDto> TopProducts { get; set; } = new();
        public List<LowStockProductDto> LowStockItems { get; set; } = new();
    }

    public class DashboardChartDataDto
    {
        public string Label { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public string Color { get; set; } = string.Empty;
    }

    public class RecentActivityDto
    {
        public string Id { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
    }

    public class TopProductDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public int TotalSold { get; set; }
        public decimal Revenue { get; set; }
    }

    public class LowStockProductDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string SKU { get; set; } = string.Empty;
        public int CurrentStock { get; set; }
        public int MinimumStock { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class DashboardConfigDto
    {
        public List<DashboardWidgetDto> Widgets { get; set; } = new();
        public string Layout { get; set; } = "grid";
        public int RefreshInterval { get; set; } = 30; // seconds
    }

    public class DashboardWidgetDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int Position { get; set; }
        public bool IsVisible { get; set; } = true;
        public Dictionary<string, object> Settings { get; set; } = new();
    }
}
