using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Dashboard;

namespace ERPSystem.Server.Controllers;

/// <summary>
/// Dashboard controller for providing aggregated dashboard data and analytics
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ISalesOrderService _salesOrderService;
    private readonly IInvoiceService _invoiceService;
    private readonly ICustomerService _customerService;
    private readonly IProductService _productService;
    private readonly IAuditService _auditService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(
        ISalesOrderService salesOrderService,
        IInvoiceService invoiceService,
        ICustomerService customerService,
        IProductService productService,
        IAuditService auditService,
        ILogger<DashboardController> logger)
    {
        _salesOrderService = salesOrderService;
        _invoiceService = invoiceService;
        _customerService = customerService;
        _productService = productService;
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Get comprehensive dashboard overview with key metrics
    /// </summary>
    [HttpGet("overview")]
    public async Task<ActionResult<Result<DashboardOverviewDto>>> GetDashboardOverview(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        try
        {
            // Set default date range if not provided
            fromDate ??= DateTime.UtcNow.AddDays(-30);
            toDate ??= DateTime.UtcNow;

            // Get all metrics in parallel
            var salesTask = GetSalesMetricsAsync(fromDate, toDate);
            var inventoryTask = GetInventoryMetricsAsync();
            var financialTask = GetFinancialMetricsAsync(fromDate, toDate);
            var customerTask = GetCustomerMetricsAsync(fromDate, toDate);
            var systemTask = GetSystemMetricsAsync();

            await Task.WhenAll(salesTask, inventoryTask, financialTask, customerTask, systemTask);

            var overview = new DashboardOverviewDto
            {
                SalesMetrics = await salesTask,
                InventoryMetrics = await inventoryTask,
                FinancialMetrics = await financialTask,
                CustomerMetrics = await customerTask,
                SystemMetrics = await systemTask,
                DateRange = new DateRangeDto
                {
                    FromDate = fromDate.Value,
                    ToDate = toDate.Value
                },
                LastUpdated = DateTime.UtcNow
            };

            return Ok(Result<DashboardOverviewDto>.Success(overview));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard overview");
            return BadRequest(Result<DashboardOverviewDto>.Failure("Failed to retrieve dashboard overview"));
        }
    }

    /// <summary>
    /// Get recent activities across the system
    /// </summary>
    [HttpGet("activities")]
    [AllowAnonymous] // Temporarily allow anonymous access for testing
    public async Task<ActionResult<Result<List<RecentActivityDto>>>> GetRecentActivities(
        [FromQuery] int limit = 10)
    {
        try
        {
            var activitiesResult = await _auditService.GetRecentActivitiesAsync(limit);

            if (!activitiesResult.IsSuccess)
            {
                _logger.LogWarning("Failed to retrieve recent activities: {Error}", activitiesResult.Error);
                return BadRequest(activitiesResult);
            }

            return Ok(activitiesResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving recent activities");
            return BadRequest(Result<List<RecentActivityDto>>.Failure("Failed to retrieve recent activities"));
        }
    }

    /// <summary>
    /// Get top customers by revenue
    /// </summary>
    [HttpGet("top-customers")]
    public async Task<ActionResult<Result<List<TopCustomerDto>>>> GetTopCustomers(
        [FromQuery] int limit = 5,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        try
        {
            // Set default date range if not provided
            fromDate ??= DateTime.UtcNow.AddDays(-90);
            toDate ??= DateTime.UtcNow;

            // Get all customers with sales data
            var customerQueryParams = new ERPSystem.Server.DTOs.Sales.CustomerQueryParameters
            {
                Page = 1,
                PageSize = 1000,
                SortBy = "Name",
                SortDescending = false
            };

            var customersResult = await _customerService.GetCustomersAsync(customerQueryParams);
            if (!customersResult.IsSuccess || customersResult.Data?.Items == null)
            {
                return Ok(Result<List<TopCustomerDto>>.Success(new List<TopCustomerDto>()));
            }

            var topCustomers = new List<TopCustomerDto>();

            // For each customer, calculate their total orders and revenue
            foreach (var customer in customersResult.Data.Items)
            {
                try
                {
                    var queryParams = new ERPSystem.Server.DTOs.Sales.SalesOrderQueryParameters
                    {
                        Page = 1,
                        PageSize = 1000,
                        CustomerId = customer.Id,
                        OrderDateFrom = fromDate,
                        OrderDateTo = toDate,
                        SortBy = "OrderDate",
                        SortDescending = true
                    };

                    var ordersResult = await _salesOrderService.GetSalesOrdersAsync(queryParams);

                    if (ordersResult.IsSuccess && ordersResult.Data?.Items?.Any() == true)
                    {
                        var orders = ordersResult.Data.Items;
                        var totalSpent = orders.Sum(o => o.TotalAmount);
                        var totalOrders = orders.Count;
                        var lastOrderDate = orders.Max(o => o.OrderDate);

                        topCustomers.Add(new TopCustomerDto
                        {
                            Id = customer.Id.ToString(),
                            Name = customer.Name,
                            Email = customer.Email ?? string.Empty,
                            TotalOrders = totalOrders,
                            TotalSpent = totalSpent,
                            LastOrderDate = lastOrderDate
                        });
                    }
                    else
                    {
                        // Include customers with no orders but show zero values
                        topCustomers.Add(new TopCustomerDto
                        {
                            Id = customer.Id.ToString(),
                            Name = customer.Name,
                            Email = customer.Email ?? string.Empty,
                            TotalOrders = 0,
                            TotalSpent = 0,
                            LastOrderDate = DateTime.MinValue
                        });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error processing customer {CustomerId} for top customers", customer.Id);
                    // Continue with other customers
                }
            }

            // Sort by total spent and take top customers
            var result = topCustomers
                .OrderByDescending(c => c.TotalSpent)
                .ThenByDescending(c => c.TotalOrders)
                .Take(limit)
                .ToList();

            return Ok(Result<List<TopCustomerDto>>.Success(result));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving top customers");
            return BadRequest(Result<List<TopCustomerDto>>.Failure("Failed to retrieve top customers"));
        }
    }

    /// <summary>
    /// Get top products by sales volume
    /// </summary>
    [HttpGet("top-products")]
    public Task<ActionResult<Result<List<TopProductDto>>>> GetTopProducts(
        [FromQuery] int limit = 5,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        try
        {
            // TODO: Implement top products logic
            var topProducts = new List<TopProductDto>();

            return Task.FromResult<ActionResult<Result<List<TopProductDto>>>>(
                Ok(Result<List<TopProductDto>>.Success(topProducts)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving top products");
            return Task.FromResult<ActionResult<Result<List<TopProductDto>>>>(
                BadRequest(Result<List<TopProductDto>>.Failure("Failed to retrieve top products")));
        }
    }

    /// <summary>
    /// Get sales chart data for dashboard visualization
    /// </summary>
    [HttpGet("sales-chart")]
    public Task<ActionResult<Result<ChartDataDto>>> GetSalesChartData(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string groupBy = "day")
    {
        try
        {
            // TODO: Implement sales chart data aggregation
            var chartData = new ChartDataDto
            {
                Labels = new List<string>(),
                Datasets = new List<ChartDatasetDto>()
            };

            return Task.FromResult<ActionResult<Result<ChartDataDto>>>(
                Ok(Result<ChartDataDto>.Success(chartData)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sales chart data");
            return Task.FromResult<ActionResult<Result<ChartDataDto>>>(
                BadRequest(Result<ChartDataDto>.Failure("Failed to retrieve sales chart data")));
        }
    }

    /// <summary>
    /// Get total inventory value
    /// </summary>
    [HttpGet("inventory-value")]
    public Task<ActionResult<Result<decimal>>> GetInventoryValue()
    {
        try
        {
            // TODO: Implement inventory value calculation
            decimal totalValue = 0;

            return Task.FromResult<ActionResult<Result<decimal>>>(
                Ok(Result<decimal>.Success(totalValue)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating inventory value");
            return Task.FromResult<ActionResult<Result<decimal>>>(
                BadRequest(Result<decimal>.Failure("Failed to calculate inventory value")));
        }
    }

    /// <summary>
    /// Get system health metrics
    /// </summary>
    [HttpGet("system-metrics")]
    public async Task<ActionResult<Result<SystemMetricsDto>>> GetSystemMetrics()
    {
        try
        {
            var systemMetrics = await GetSystemMetricsAsync();
            return Ok(Result<SystemMetricsDto>.Success(systemMetrics));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving system metrics");
            return BadRequest(Result<SystemMetricsDto>.Failure("Failed to retrieve system metrics"));
        }
    }

    #region Private Helper Methods

    private async Task<SalesMetricsDto> GetSalesMetricsAsync(DateTime? fromDate, DateTime? toDate)
    {
        var salesStats = await _salesOrderService.GetSalesOrderStatsAsync(fromDate, toDate);

        return new SalesMetricsDto
        {
            TotalSales = salesStats.IsSuccess ? salesStats.Data!.TotalRevenue : 0,
            TotalOrders = salesStats.IsSuccess ? salesStats.Data!.TotalOrders : 0,
            AverageOrderValue = salesStats.IsSuccess ? salesStats.Data!.AverageOrderValue : 0,
            CompletedOrders = salesStats.IsSuccess ? salesStats.Data!.CompletedOrders : 0,
            PendingOrders = salesStats.IsSuccess ? (salesStats.Data!.NewOrders + salesStats.Data!.ProcessingOrders) : 0,
            CancelledOrders = salesStats.IsSuccess ? salesStats.Data!.CancelledOrders : 0
        };
    }

    private Task<InventoryMetricsDto> GetInventoryMetricsAsync()
    {
        // TODO: Implement actual inventory metrics calculation
        return Task.FromResult(new InventoryMetricsDto
        {
            TotalProducts = 0,
            LowStockItems = 0,
            OutOfStockItems = 0,
            TotalInventoryValue = 0
        });
    }

    private async Task<FinancialMetricsDto> GetFinancialMetricsAsync(DateTime? fromDate, DateTime? toDate)
    {
        var invoiceStats = await _invoiceService.GetInvoiceStatsAsync(fromDate, toDate);

        return new FinancialMetricsDto
        {
            TotalRevenue = invoiceStats.IsSuccess ? invoiceStats.Data!.TotalInvoiced : 0,
            TotalPaid = invoiceStats.IsSuccess ? invoiceStats.Data!.TotalPaid : 0,
            TotalOutstanding = invoiceStats.IsSuccess ? invoiceStats.Data!.TotalOutstanding : 0,
            TotalOverdue = invoiceStats.IsSuccess ? invoiceStats.Data!.TotalOverdue : 0,
            AveragePaymentDays = invoiceStats.IsSuccess ? invoiceStats.Data!.AveragePaymentDays : 0
        };
    }

    private Task<CustomerMetricsDto> GetCustomerMetricsAsync(DateTime? fromDate, DateTime? toDate)
    {
        // TODO: Implement customer metrics
        return Task.FromResult(new CustomerMetricsDto
        {
            TotalCustomers = 0,
            NewCustomers = 0,
            ActiveCustomers = 0
        });
    }

    private Task<SystemMetricsDto> GetSystemMetricsAsync()
    {
        // TODO: Implement actual system metrics
        return Task.FromResult(new SystemMetricsDto
        {
            ActiveUsers = 1, // TODO: Get from user session tracking
            SystemHealth = "Healthy",
            LastBackup = DateTime.UtcNow.AddHours(-2), // TODO: Get from backup service
            PendingTasks = new List<PendingTaskDto>(),
            SystemAlerts = new List<SystemAlertDto>()
        });
    }
    #endregion
}
