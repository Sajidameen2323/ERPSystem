using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.DTOs.Dashboard;
using ERPSystem.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.Server.Services.Implementations
{
    public class DashboardService : IDashboardService
    {
        private readonly ApplicationDbContext _context;

        public DashboardService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync()
        {
            var stats = new DashboardStatsDto();

            // User Statistics
            var userStats = await _context.Users
                .GroupBy(u => u.IsActive)
                .Select(g => new { IsActive = g.Key, Count = g.Count() })
                .ToListAsync();

            stats.TotalUsers = userStats.Sum(s => s.Count);
            stats.ActiveUsers = userStats.FirstOrDefault(s => s.IsActive)?.Count ?? 0;

            // Product Statistics (assuming Products table exists)
            try
            {
                // This will be implemented when Products entity is available
                // var productStats = await _context.Products
                //     .Where(p => !p.IsDeleted)
                //     .GroupBy(p => p.CurrentStock <= p.MinimumStock)
                //     .Select(g => new { IsLowStock = g.Key, Count = g.Count() })
                //     .ToListAsync();

                // stats.TotalProducts = productStats.Sum(s => s.Count);
                // stats.LowStockProducts = productStats.FirstOrDefault(s => s.IsLowStock)?.Count ?? 0;

                // For now, using mock data
                stats.TotalProducts = 0;
                stats.LowStockProducts = 0;
            }
            catch
            {
                stats.TotalProducts = 0;
                stats.LowStockProducts = 0;
            }

            // Customer and Sales Statistics (will be implemented when entities are available)
            stats.TotalCustomers = 0;
            stats.TotalSalesOrders = 0;
            stats.TotalRevenue = 0;
            stats.TotalRevenueThisMonth = 0;

            // Generate sample chart data
            stats.SalesChartData = GenerateSampleSalesData();
            stats.InventoryChartData = GenerateSampleInventoryData();

            // Recent Activities
            stats.RecentActivities = await GetRecentActivitiesAsync(5);

            return stats;
        }

        public async Task<DashboardConfigDto> GetDashboardConfigAsync(string userId)
        {
            // For now, return default configuration
            // In a real implementation, this would be stored per user
            return await Task.FromResult(GetDefaultDashboardConfig());
        }

        public async Task<DashboardConfigDto> UpdateDashboardConfigAsync(string userId, DashboardConfigDto config)
        {
            // In a real implementation, this would save to database
            // For now, just return the config
            return await Task.FromResult(config);
        }

        public async Task<List<RecentActivityDto>> GetRecentActivitiesAsync(int count = 10)
        {
            var activities = new List<RecentActivityDto>();

            // Add user-related activities
            var recentUsers = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Take(count / 2)
                .Select(u => new RecentActivityDto
                {
                    Id = u.Id,
                    Description = $"New user registered: {u.Email}",
                    Type = "user_registered",
                    Timestamp = u.CreatedAt,
                    UserName = u.Email ?? "System",
                    Icon = "user-plus",
                    Color = "bg-green-100 text-green-600"
                })
                .ToListAsync();

            activities.AddRange(recentUsers);

            // Add system activities
            activities.Add(new RecentActivityDto
            {
                Id = Guid.NewGuid().ToString(),
                Description = "System backup completed successfully",
                Type = "system_backup",
                Timestamp = DateTime.UtcNow.AddHours(-2),
                UserName = "System",
                Icon = "database",
                Color = "bg-blue-100 text-blue-600"
            });

            return activities.OrderByDescending(a => a.Timestamp).Take(count).ToList();
        }

        private List<DashboardChartDataDto> GenerateSampleSalesData()
        {
            return new List<DashboardChartDataDto>
            {
                new() { Label = "January", Value = 12500, Color = "#3B82F6" },
                new() { Label = "February", Value = 15200, Color = "#10B981" },
                new() { Label = "March", Value = 18700, Color = "#F59E0B" },
                new() { Label = "April", Value = 22100, Color = "#EF4444" },
                new() { Label = "May", Value = 19800, Color = "#8B5CF6" },
                new() { Label = "June", Value = 25300, Color = "#06B6D4" }
            };
        }

        private List<DashboardChartDataDto> GenerateSampleInventoryData()
        {
            return new List<DashboardChartDataDto>
            {
                new() { Label = "Electronics", Value = 45, Color = "#3B82F6" },
                new() { Label = "Clothing", Value = 30, Color = "#10B981" },
                new() { Label = "Books", Value = 15, Color = "#F59E0B" },
                new() { Label = "Home & Garden", Value = 10, Color = "#EF4444" }
            };
        }

        private DashboardConfigDto GetDefaultDashboardConfig()
        {
            return new DashboardConfigDto
            {
                Layout = "grid",
                RefreshInterval = 30,
                Widgets = new List<DashboardWidgetDto>
                {
                    new() { Id = "stats-overview", Title = "Statistics Overview", Type = "stats-cards", Position = 1, IsVisible = true },
                    new() { Id = "sales-chart", Title = "Sales Trends", Type = "line-chart", Position = 2, IsVisible = true },
                    new() { Id = "inventory-chart", Title = "Inventory Distribution", Type = "pie-chart", Position = 3, IsVisible = true },
                    new() { Id = "recent-activities", Title = "Recent Activities", Type = "activity-feed", Position = 4, IsVisible = true },
                    new() { Id = "low-stock-alerts", Title = "Low Stock Alerts", Type = "alert-list", Position = 5, IsVisible = true },
                    new() { Id = "top-products", Title = "Top Products", Type = "product-list", Position = 6, IsVisible = true }
                }
            };
        }
    }
}
