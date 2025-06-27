using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.DTOs.Dashboard;
using ERPSystem.Server.Common;
using System.Security.Claims;

namespace ERPSystem.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        /// <summary>
        /// Get dashboard statistics for admin users
        /// </summary>
        [HttpGet("stats")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Result<DashboardStatsDto>>> GetDashboardStats()
        {
            try
            {
                var stats = await _dashboardService.GetDashboardStatsAsync();
                return Ok(Result<DashboardStatsDto>.Success(stats));
            }
            catch (Exception ex)
            {
                return StatusCode(500, Result<DashboardStatsDto>.Failure($"Failed to retrieve dashboard statistics: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get user's dashboard configuration
        /// </summary>
        [HttpGet("config")]
        public async Task<ActionResult<Result<DashboardConfigDto>>> GetDashboardConfig()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return BadRequest(Result<DashboardConfigDto>.Failure("User ID not found"));
                }

                var config = await _dashboardService.GetDashboardConfigAsync(userId);
                return Ok(Result<DashboardConfigDto>.Success(config));
            }
            catch (Exception ex)
            {
                return StatusCode(500, Result<DashboardConfigDto>.Failure($"Failed to retrieve dashboard configuration: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update user's dashboard configuration
        /// </summary>
        [HttpPut("config")]
        public async Task<ActionResult<Result<DashboardConfigDto>>> UpdateDashboardConfig([FromBody] DashboardConfigDto config)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return BadRequest(Result<DashboardConfigDto>.Failure("User ID not found"));
                }

                var updatedConfig = await _dashboardService.UpdateDashboardConfigAsync(userId, config);
                return Ok(Result<DashboardConfigDto>.Success(updatedConfig));
            }
            catch (Exception ex)
            {
                return StatusCode(500, Result<DashboardConfigDto>.Failure($"Failed to update dashboard configuration: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get recent activities
        /// </summary>
        [HttpGet("activities")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Result<List<RecentActivityDto>>>> GetRecentActivities([FromQuery] int count = 10)
        {
            try
            {
                var activities = await _dashboardService.GetRecentActivitiesAsync(count);
                return Ok(Result<List<RecentActivityDto>>.Success(activities));
            }
            catch (Exception ex)
            {
                return StatusCode(500, Result<List<RecentActivityDto>>.Failure($"Failed to retrieve recent activities: {ex.Message}"));
            }
        }
    }
}
