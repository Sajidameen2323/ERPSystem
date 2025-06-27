using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.DTOs.Dashboard;

namespace ERPSystem.Server.Services.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardStatsDto> GetDashboardStatsAsync();
        Task<DashboardConfigDto> GetDashboardConfigAsync(string userId);
        Task<DashboardConfigDto> UpdateDashboardConfigAsync(string userId, DashboardConfigDto config);
        Task<List<RecentActivityDto>> GetRecentActivitiesAsync(int count = 10);
    }
}
