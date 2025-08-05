using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Dashboard;
using ERPSystem.Server.Models;

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
    private readonly IPurchaseOrderService _purchaseOrderService;
    private readonly IPurchaseOrderReturnService _purchaseOrderReturnService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(
        ISalesOrderService salesOrderService,
        IInvoiceService invoiceService,
        ICustomerService customerService,
        IProductService productService,
        IAuditService auditService,
        IPurchaseOrderService purchaseOrderService,
        IPurchaseOrderReturnService purchaseOrderReturnService,
        ILogger<DashboardController> logger)
    {
        _salesOrderService = salesOrderService;
        _invoiceService = invoiceService;
        _customerService = customerService;
        _productService = productService;
        _auditService = auditService;
        _purchaseOrderService = purchaseOrderService;
        _purchaseOrderReturnService = purchaseOrderReturnService;
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
    public async Task<ActionResult<Result<ChartDataDto>>> GetSalesChartData(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string groupBy = "day")
    {
        try
        {
            // Set default date range if not provided
            fromDate ??= DateTime.UtcNow.AddDays(-30);
            toDate ??= DateTime.UtcNow;

            // Validate groupBy parameter
            if (!new[] { "day", "week", "month", "year" }.Contains(groupBy.ToLower()))
            {
                groupBy = "day";
            }

            _logger.LogInformation("Generating sales chart data from {FromDate} to {ToDate}, grouped by {GroupBy}", 
                fromDate, toDate, groupBy);

            // Get sales orders data
            var salesOrderParams = new ERPSystem.Server.DTOs.Sales.SalesOrderQueryParameters
            {
                Page = 1,
                PageSize = int.MaxValue, // Get all records for aggregation
                OrderDateFrom = fromDate,
                OrderDateTo = toDate,
                SortBy = "OrderDate",
                SortDescending = false
            };

            var salesOrdersResult = await _salesOrderService.GetSalesOrdersAsync(salesOrderParams);

            // Get invoice data for more accurate revenue tracking
            var invoiceParams = new ERPSystem.Server.DTOs.Sales.InvoiceQueryParameters
            {
                Page = 1,
                PageSize = int.MaxValue,
                InvoiceDateFrom = fromDate,
                InvoiceDateTo = toDate,
                SortBy = "InvoiceDate",
                SortDescending = false
            };

            var invoicesResult = await _invoiceService.GetInvoicesAsync(invoiceParams);

            var chartData = new ChartDataDto();

            // Generate time period labels and data based on groupBy parameter
            var salesData = new List<decimal>();
            var revenueData = new List<decimal>();
            var orderCountData = new List<decimal>();
            var labels = new List<string>();

            // Create time periods based on groupBy
            var timePeriods = GenerateTimePeriods(fromDate.Value, toDate.Value, groupBy);

            foreach (var period in timePeriods)
            {
                labels.Add(FormatPeriodLabel(period, groupBy));

                // Calculate sales orders total for this period
                decimal periodSalesTotal = 0;
                int periodOrderCount = 0;

                if (salesOrdersResult.IsSuccess && salesOrdersResult.Data?.Items != null)
                {
                    var periodOrders = salesOrdersResult.Data.Items.Where(so => 
                        IsDateInPeriod(so.OrderDate, period, groupBy)).ToList();
                    
                    periodSalesTotal = periodOrders.Sum(so => so.TotalAmount);
                    periodOrderCount = periodOrders.Count;
                }

                // Calculate invoice revenue for this period (more accurate for actual revenue)
                decimal periodRevenue = 0;

                if (invoicesResult.IsSuccess && invoicesResult.Data?.Items != null)
                {
                    var periodInvoices = invoicesResult.Data.Items.Where(inv => 
                        IsDateInPeriod(inv.InvoiceDate, period, groupBy) && 
                        inv.Status != InvoiceStatus.Cancelled).ToList();
                    
                    periodRevenue = periodInvoices.Sum(inv => inv.PaidAmount); // Use paid amount for actual revenue
                }

                salesData.Add(periodSalesTotal);
                revenueData.Add(periodRevenue);
                orderCountData.Add(periodOrderCount);
            }

            // Create datasets for the chart
            chartData.Labels = labels;
            chartData.Datasets = new List<ChartDatasetDto>
            {
                new ChartDatasetDto
                {
                    Label = "Sales Orders Total",
                    Data = salesData,
                    BackgroundColor = "rgba(54, 162, 235, 0.5)",
                    BorderColor = "rgba(54, 162, 235, 1)",
                    BorderWidth = 2,
                    Fill = false,
                    Tension = 0.1m
                },
                new ChartDatasetDto
                {
                    Label = "Revenue (Paid)",
                    Data = revenueData,
                    BackgroundColor = "rgba(75, 192, 192, 0.5)",
                    BorderColor = "rgba(75, 192, 192, 1)",
                    BorderWidth = 2,
                    Fill = false,
                    Tension = 0.1m
                },
                new ChartDatasetDto
                {
                    Label = "Order Count",
                    Data = orderCountData,
                    BackgroundColor = "rgba(255, 206, 86, 0.5)",
                    BorderColor = "rgba(255, 206, 86, 1)",
                    BorderWidth = 2,
                    Fill = false,
                    Tension = 0.1m
                }
            };

            _logger.LogInformation("Generated sales chart data with {DataPoints} data points", labels.Count);

            return Ok(Result<ChartDataDto>.Success(chartData));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving sales chart data");
            return BadRequest(Result<ChartDataDto>.Failure("Failed to retrieve sales chart data"));
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

    /// <summary>
    /// Get comprehensive financial metrics including sales revenue, purchase costs, and returns
    /// </summary>
    [HttpGet("financial-metrics")]
    [AllowAnonymous] // Temporarily disabled for testing
    public async Task<ActionResult<Result<FinancialMetricsDto>>> GetComprehensiveFinancialMetrics(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        try
        {
            // Set default date range if not provided
            fromDate ??= DateTime.UtcNow.AddDays(-30);
            toDate ??= DateTime.UtcNow;

            var financialMetrics = await GetComprehensiveFinancialMetricsAsync(fromDate, toDate);
            return Ok(Result<FinancialMetricsDto>.Success(financialMetrics));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving comprehensive financial metrics");
            return BadRequest(Result<FinancialMetricsDto>.Failure("Failed to retrieve comprehensive financial metrics"));
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
        // Use the comprehensive financial metrics
        return await GetComprehensiveFinancialMetricsAsync(fromDate, toDate);
    }

    private async Task<FinancialMetricsDto> GetComprehensiveFinancialMetricsAsync(DateTime? fromDate, DateTime? toDate)
    {
        try
        {
            // Execute operations sequentially to avoid DbContext threading issues
            // Get sales revenue data from invoices
            var invoiceStats = await _invoiceService.GetInvoiceStatsAsync(fromDate, toDate);

            // Get purchase costs data from purchase orders
            var purchaseData = await _purchaseOrderService.GetFinancialDataAsync(fromDate, toDate);

            // Get returns data from purchase order returns
            var returnData = await GetPurchaseReturnFinancialDataAsync(fromDate, toDate);

            // Sales/Revenue metrics (from Invoices)
            var totalRevenue = invoiceStats.IsSuccess ? invoiceStats.Data!.TotalInvoiced : 0;
            var totalPaid = invoiceStats.IsSuccess ? invoiceStats.Data!.TotalPaid : 0;
            var totalOutstanding = invoiceStats.IsSuccess ? invoiceStats.Data!.TotalOutstanding : 0;
            var totalOverdue = invoiceStats.IsSuccess ? invoiceStats.Data!.TotalOverdue : 0;
            var averagePaymentDays = invoiceStats.IsSuccess ? invoiceStats.Data!.AveragePaymentDays : 0;

            // Purchase metrics
            var totalPurchaseValue = purchaseData.TotalPurchaseValue;
            var totalPurchasePaid = purchaseData.TotalPurchasePaid;
            var totalPurchaseOutstanding = purchaseData.TotalPurchaseOutstanding;

            // Return metrics
            var totalReturnValue = returnData;

            // Calculate combined metrics
            var grossMargin = totalRevenue > 0 ? ((totalRevenue - totalPurchaseValue) / totalRevenue * 100) : 0;
            var netCashFlow = totalPaid - totalPurchasePaid + totalReturnValue;

            // Debug logging
            _logger.LogInformation("Financial Metrics Debug - Invoice Stats Success: {InvoiceSuccess}, Purchase Data: Value={PurchaseValue}, Paid={PurchasePaid}, Outstanding={PurchaseOutstanding}, Return Value: {ReturnValue}", 
                invoiceStats.IsSuccess, totalPurchaseValue, totalPurchasePaid, totalPurchaseOutstanding, totalReturnValue);

            return new FinancialMetricsDto
            {
                // Sales/Revenue metrics
                TotalRevenue = totalRevenue,
                TotalPaid = totalPaid,
                TotalOutstanding = totalOutstanding,
                TotalOverdue = totalOverdue,
                AveragePaymentDays = averagePaymentDays,

                // Supply Chain/Purchase metrics
                TotalPurchaseValue = totalPurchaseValue,
                TotalPurchasePaid = totalPurchasePaid,
                TotalPurchaseOutstanding = totalPurchaseOutstanding,
                TotalReturnValue = totalReturnValue,

                // Combined metrics
                NetCashFlow = netCashFlow,
                GrossMargin = grossMargin,

                PaymentTrends = new List<PaymentTrendDto>(), // TODO: Implement payment trends
                CashFlow = new CashFlowDto
                {
                    Income = totalPaid,
                    Expenses = totalPurchasePaid,
                    Net = netCashFlow
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating comprehensive financial metrics");
            return new FinancialMetricsDto();
        }
    }

    private async Task<decimal> GetPurchaseReturnFinancialDataAsync(DateTime? fromDate, DateTime? toDate)
    {
        try
        {
            // Get all purchase order returns within the date range
            var returnsResult = await _purchaseOrderReturnService.GetReturnsAsync(
                page: 1,
                pageSize: int.MaxValue, // Get all records for financial calculation
                search: null,
                status: null,
                dateFrom: fromDate,
                dateTo: toDate
            );

            if (returnsResult?.Items == null)
            {
                return 0;
            }

            var returns = returnsResult.Items;

            decimal totalReturnValue = 0;

            foreach (var returnItem in returns)
            {
                // Only count processed returns for financial impact
                if (returnItem.Status == (int)ReturnStatus.Processed)
                {
                    totalReturnValue += returnItem.TotalReturnAmount;
                }
            }

            return totalReturnValue;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating purchase return financial data");
            return 0;
        }
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

    /// <summary>
    /// Generate time periods based on the groupBy parameter
    /// </summary>
    private List<DateTime> GenerateTimePeriods(DateTime fromDate, DateTime toDate, string groupBy)
    {
        var periods = new List<DateTime>();
        var current = fromDate.Date;

        switch (groupBy.ToLower())
        {
            case "day":
                while (current <= toDate.Date)
                {
                    periods.Add(current);
                    current = current.AddDays(1);
                }
                break;

            case "week":
                // Start from the beginning of the week
                var startOfWeek = current.AddDays(-(int)current.DayOfWeek);
                current = startOfWeek;
                while (current <= toDate.Date)
                {
                    periods.Add(current);
                    current = current.AddDays(7);
                }
                break;

            case "month":
                // Start from the beginning of the month
                current = new DateTime(current.Year, current.Month, 1);
                while (current <= toDate.Date)
                {
                    periods.Add(current);
                    current = current.AddMonths(1);
                }
                break;

            case "year":
                // Start from the beginning of the year
                current = new DateTime(current.Year, 1, 1);
                while (current <= toDate.Date)
                {
                    periods.Add(current);
                    current = current.AddYears(1);
                }
                break;

            default:
                // Default to daily
                while (current <= toDate.Date)
                {
                    periods.Add(current);
                    current = current.AddDays(1);
                }
                break;
        }

        return periods;
    }

    /// <summary>
    /// Format the period label based on groupBy parameter
    /// </summary>
    private string FormatPeriodLabel(DateTime period, string groupBy)
    {
        return groupBy.ToLower() switch
        {
            "day" => period.ToString("MMM dd"),
            "week" => $"Week of {period:MMM dd}",
            "month" => period.ToString("MMM yyyy"),
            "year" => period.ToString("yyyy"),
            _ => period.ToString("MMM dd")
        };
    }

    /// <summary>
    /// Check if a date falls within a specific period based on groupBy
    /// </summary>
    private bool IsDateInPeriod(DateTime date, DateTime period, string groupBy)
    {
        return groupBy.ToLower() switch
        {
            "day" => date.Date == period.Date,
            "week" => date.Date >= period.Date && date.Date < period.AddDays(7).Date,
            "month" => date.Year == period.Year && date.Month == period.Month,
            "year" => date.Year == period.Year,
            _ => date.Date == period.Date
        };
    }
    #endregion
}
