using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Models;
using ERPSystem.Server.DTOs.Dashboard;
using ERPSystem.Server.Common;
using ERPSystem.Server.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Security.Claims;

namespace ERPSystem.Server.Services.Implementations;

/// <summary>
/// Implementation of audit service for tracking system activities
/// </summary>
public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AuditService> _logger;

    public AuditService(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        ILogger<AuditService> logger)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task LogActivityAsync(string activityType, string entityType, string? entityId,
        string title, string? description = null, object? oldValues = null,
        object? newValues = null, string severity = "Info", string? icon = null)
    {
        try
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var userId = httpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "system";
            var userName = httpContext?.User?.FindFirst(ClaimTypes.Name)?.Value ?? 
                          httpContext?.User?.FindFirst("name")?.Value;
            var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();
            var userAgent = httpContext?.Request?.Headers["User-Agent"].ToString();
            var sessionId = httpContext?.Session?.Id;

            var auditLog = new AuditLog
            {
                ActivityType = activityType,
                EntityType = entityType,
                EntityId = entityId,
                UserId = userId,
                UserName = userName,
                Title = title,
                Description = description,
                OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
                NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
                Timestamp = DateTime.UtcNow,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Severity = severity,
                Icon = icon ?? GetDefaultIcon(activityType),
                SessionId = sessionId
            };

            await LogActivityAsync(auditLog);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging audit activity: {ActivityType} for {EntityType}", 
                activityType, entityType);
        }
    }

    public async Task LogActivityAsync(AuditLog auditLog)
    {
        try
        {
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving audit log to database");
        }
    }

    public async Task<Result<List<RecentActivityDto>>> GetRecentActivitiesAsync(int limit = 10, bool includeArchived = false)
    {
        try
        {
            var query = _context.AuditLogs.AsQueryable();

            if (!includeArchived)
            {
                query = query.Where(a => !a.IsArchived);
            }

            var auditLogs = await query
                .OrderByDescending(a => a.Timestamp)
                .Take(limit)
                .ToListAsync();

            var activities = auditLogs.Select(a => new RecentActivityDto
            {
                Id = a.Id.ToString(),
                Type = a.ActivityType.ToLower(),
                Title = a.Title,
                Description = a.Description ?? string.Empty,
                Timestamp = a.Timestamp,
                Icon = a.Icon ?? "Activity",
                Severity = a.Severity.ToLower(),
                UserId = a.UserId,
                EntityId = a.EntityId ?? string.Empty,
                EntityType = a.EntityType.ToLower(),
                Metadata = !string.IsNullOrEmpty(a.Metadata) 
                    ? JsonSerializer.Deserialize<Dictionary<string, object>>(a.Metadata) 
                    : null
            }).ToList();

            return Result<List<RecentActivityDto>>.Success(activities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving recent activities");
            return Result<List<RecentActivityDto>>.Failure("Failed to retrieve recent activities");
        }
    }

    public async Task<Result<PagedResult<AuditLog>>> GetAuditLogsAsync(
        int page = 1, int pageSize = 50, string? entityType = null, string? activityType = null,
        string? userId = null, DateTime? fromDate = null, DateTime? toDate = null, string? severity = null)
    {
        try
        {
            var query = _context.AuditLogs.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(entityType))
                query = query.Where(a => a.EntityType == entityType);

            if (!string.IsNullOrEmpty(activityType))
                query = query.Where(a => a.ActivityType == activityType);

            if (!string.IsNullOrEmpty(userId))
                query = query.Where(a => a.UserId == userId);

            if (fromDate.HasValue)
                query = query.Where(a => a.Timestamp >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(a => a.Timestamp <= toDate.Value);

            if (!string.IsNullOrEmpty(severity))
                query = query.Where(a => a.Severity == severity);

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var pagedResult = new PagedResult<AuditLog>
            {
                Items = items,
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize
            };

            return Result<PagedResult<AuditLog>>.Success(pagedResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit logs");
            return Result<PagedResult<AuditLog>>.Failure("Failed to retrieve audit logs");
        }
    }

    public async Task<Result<List<AuditLog>>> GetEntityAuditTrailAsync(string entityType, string entityId)
    {
        try
        {
            var auditTrail = await _context.AuditLogs
                .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync();

            return Result<List<AuditLog>>.Success(auditTrail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit trail for {EntityType} {EntityId}", entityType, entityId);
            return Result<List<AuditLog>>.Failure("Failed to retrieve audit trail");
        }
    }

    public async Task<Result<int>> ArchiveOldLogsAsync(DateTime beforeDate)
    {
        try
        {
            var logsToArchive = await _context.AuditLogs
                .Where(a => a.Timestamp < beforeDate && !a.IsArchived)
                .ToListAsync();

            foreach (var log in logsToArchive)
            {
                log.IsArchived = true;
            }

            await _context.SaveChangesAsync();
            
            return Result<int>.Success(logsToArchive.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error archiving old audit logs");
            return Result<int>.Failure("Failed to archive old audit logs");
        }
    }

    public async Task<Result<AuditStatsDto>> GetAuditStatsAsync(DateTime? fromDate = null, DateTime? toDate = null)
    {
        try
        {
            var query = _context.AuditLogs.AsQueryable();

            if (fromDate.HasValue)
                query = query.Where(a => a.Timestamp >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(a => a.Timestamp <= toDate.Value);

            var totalActivities = await query.CountAsync();
            var uniqueUsers = await query.Select(a => a.UserId).Distinct().CountAsync();

            var activityBreakdown = await query
                .GroupBy(a => a.ActivityType)
                .Select(g => new ActivityTypeStatsDto
                {
                    ActivityType = g.Key,
                    Count = g.Count(),
                    Percentage = totalActivities > 0 ? (decimal)g.Count() / totalActivities * 100 : 0
                })
                .OrderByDescending(x => x.Count)
                .ToListAsync();

            var topActiveUsers = await query
                .GroupBy(a => new { a.UserId, a.UserName })
                .Select(g => new UserActivityStatsDto
                {
                    UserId = g.Key.UserId,
                    UserName = g.Key.UserName,
                    ActivityCount = g.Count(),
                    LastActivity = g.Max(a => a.Timestamp)
                })
                .OrderByDescending(x => x.ActivityCount)
                .Take(10)
                .ToListAsync();

            var stats = new AuditStatsDto
            {
                TotalActivities = totalActivities,
                UniqueUsers = uniqueUsers,
                CreatedRecords = await query.CountAsync(a => a.ActivityType == "Create"),
                UpdatedRecords = await query.CountAsync(a => a.ActivityType == "Update"),
                DeletedRecords = await query.CountAsync(a => a.ActivityType == "Delete"),
                LoginActivities = await query.CountAsync(a => a.ActivityType == "Login"),
                ActivityBreakdown = activityBreakdown,
                TopActiveUsers = topActiveUsers
            };

            return Result<AuditStatsDto>.Success(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving audit statistics");
            return Result<AuditStatsDto>.Failure("Failed to retrieve audit statistics");
        }
    }

    #region Private Helper Methods

    private static string GetDefaultIcon(string activityType)
    {
        return activityType.ToLower() switch
        {
            "create" => "Plus",
            "update" => "Edit",
            "delete" => "Trash2",
            "login" => "LogIn",
            "logout" => "LogOut",
            "view" => "Eye",
            "export" => "Download",
            "import" => "Upload",
            "payment" => "DollarSign",
            "order" => "ShoppingCart",
            "customer" => "User",
            "product" => "Package",
            "invoice" => "FileText",
            "system" => "Settings",
            "error" => "AlertTriangle",
            "warning" => "AlertCircle",
            _ => "Activity"
        };
    }

    #endregion
}
