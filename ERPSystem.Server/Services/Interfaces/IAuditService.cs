using ERPSystem.Server.Models;
using ERPSystem.Server.DTOs.Dashboard;
using ERPSystem.Server.Common;

namespace ERPSystem.Server.Services.Interfaces;

/// <summary>
/// Service for managing audit logs and activity tracking
/// </summary>
public interface IAuditService
{
    /// <summary>
    /// Log an activity to the audit table
    /// </summary>
    Task LogActivityAsync(string activityType, string entityType, string? entityId, 
        string title, string? description = null, object? oldValues = null, 
        object? newValues = null, string severity = "Info", string? icon = null);

    /// <summary>
    /// Log an activity with additional metadata
    /// </summary>
    Task LogActivityAsync(AuditLog auditLog);

    /// <summary>
    /// Get recent activities for dashboard
    /// </summary>
    Task<Result<List<RecentActivityDto>>> GetRecentActivitiesAsync(int limit = 10, bool includeArchived = false);

    /// <summary>
    /// Get audit logs with pagination and filtering
    /// </summary>
    Task<Result<PagedResult<AuditLog>>> GetAuditLogsAsync(
        int page = 1, 
        int pageSize = 50,
        string? entityType = null,
        string? activityType = null,
        string? userId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? severity = null);

    /// <summary>
    /// Get audit trail for a specific entity
    /// </summary>
    Task<Result<List<AuditLog>>> GetEntityAuditTrailAsync(string entityType, string entityId);

    /// <summary>
    /// Archive old audit logs (for performance)
    /// </summary>
    Task<Result<int>> ArchiveOldLogsAsync(DateTime beforeDate);

    /// <summary>
    /// Get audit statistics
    /// </summary>
    Task<Result<AuditStatsDto>> GetAuditStatsAsync(DateTime? fromDate = null, DateTime? toDate = null);
}

/// <summary>
/// Audit statistics DTO
/// </summary>
public class AuditStatsDto
{
    public int TotalActivities { get; set; }
    public int UniqueUsers { get; set; }
    public int CreatedRecords { get; set; }
    public int UpdatedRecords { get; set; }
    public int DeletedRecords { get; set; }
    public int LoginActivities { get; set; }
    public List<ActivityTypeStatsDto> ActivityBreakdown { get; set; } = new();
    public List<UserActivityStatsDto> TopActiveUsers { get; set; } = new();
}

/// <summary>
/// Activity type statistics
/// </summary>
public class ActivityTypeStatsDto
{
    public string ActivityType { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

/// <summary>
/// User activity statistics
/// </summary>
public class UserActivityStatsDto
{
    public string UserId { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public int ActivityCount { get; set; }
    public DateTime LastActivity { get; set; }
}
