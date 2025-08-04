using ERPSystem.Server.Data;
using ERPSystem.Server.Models;
using ERPSystem.Server.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.Server.Services;

/// <summary>
/// Service to seed initial audit data for testing
/// </summary>
public class AuditDataSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly IAuditService _auditService;
    private readonly ILogger<AuditDataSeeder> _logger;

    public AuditDataSeeder(
        ApplicationDbContext context,
        IAuditService auditService,
        ILogger<AuditDataSeeder> logger)
    {
        _context = context;
        _auditService = auditService;
        _logger = logger;
    }

    public async Task SeedAuditDataAsync()
    {
        try
        {
            // Check if audit data already exists
            var existingLogs = await _context.AuditLogs.AnyAsync();
            if (existingLogs)
            {
                _logger.LogInformation("Audit data already exists, skipping seed");
                return;
            }

            _logger.LogInformation("Seeding initial audit data...");

            var baseTime = DateTime.UtcNow.AddDays(-7);

            // Create sample audit logs for the last week
            var auditLogs = new List<AuditLog>
            {
                // System activities
                new()
                {
                    ActivityType = "Login",
                    EntityType = "User",
                    EntityId = "user-001",
                    UserId = "admin@example.com",
                    UserName = "System Administrator",
                    Title = "User login",
                    Description = "Administrator logged into the system",
                    Timestamp = baseTime.AddMinutes(-30),
                    Severity = "Info",
                    Icon = "LogIn",
                    IpAddress = "192.168.1.100"
                },

                // Customer operations
                new()
                {
                    ActivityType = "Create",
                    EntityType = "Customer",
                    EntityId = "cust-001",
                    UserId = "sales@example.com",
                    UserName = "Sales User",
                    Title = "New customer created",
                    Description = "ABC Corporation has been added as a new customer",
                    Timestamp = baseTime.AddHours(-5),
                    Severity = "Success",
                    Icon = "UserPlus",
                    IpAddress = "192.168.1.101",
                    NewValues = """{"Name": "ABC Corporation", "Email": "contact@abc.com", "Phone": "+1-555-0123"}"""
                },

                // Product operations
                new()
                {
                    ActivityType = "Create",
                    EntityType = "Product",
                    EntityId = "prod-001",
                    UserId = "inventory@example.com",
                    UserName = "Inventory Manager",
                    Title = "New product created",
                    Description = "Wireless Mouse added to inventory",
                    Timestamp = baseTime.AddHours(-4),
                    Severity = "Success",
                    Icon = "Package",
                    IpAddress = "192.168.1.102",
                    NewValues = """{"Name": "Wireless Mouse", "SKU": "WM-001", "Price": 29.99, "Stock": 100}"""
                },

                // Sales order activities
                new()
                {
                    ActivityType = "Create",
                    EntityType = "SalesOrder",
                    EntityId = "so-001",
                    UserId = "sales@example.com",
                    UserName = "Sales User",
                    Title = "New sales order created",
                    Description = "Order #ORD-2025-001 placed by ABC Corporation",
                    Timestamp = baseTime.AddHours(-3),
                    Severity = "Success",
                    Icon = "ShoppingCart",
                    IpAddress = "192.168.1.101",
                    NewValues = """{"OrderNumber": "ORD-2025-001", "CustomerId": "cust-001", "TotalAmount": 149.95}"""
                },

                // Stock movement
                new()
                {
                    ActivityType = "Update",
                    EntityType = "Product",
                    EntityId = "prod-001",
                    UserId = "inventory@example.com",
                    UserName = "Inventory Manager",
                    Title = "Stock adjustment",
                    Description = "Stock level adjusted for Wireless Mouse",
                    Timestamp = baseTime.AddHours(-2),
                    Severity = "Info",
                    Icon = "Edit",
                    IpAddress = "192.168.1.102",
                    OldValues = """{"Stock": 100}""",
                    NewValues = """{"Stock": 95}"""
                },

                // Invoice creation
                new()
                {
                    ActivityType = "Create",
                    EntityType = "Invoice",
                    EntityId = "inv-001",
                    UserId = "accounting@example.com",
                    UserName = "Accounting Manager",
                    Title = "Invoice generated",
                    Description = "Invoice #INV-2025-001 generated for order #ORD-2025-001",
                    Timestamp = baseTime.AddHours(-1),
                    Severity = "Success",
                    Icon = "FileText",
                    IpAddress = "192.168.1.103",
                    NewValues = """{"InvoiceNumber": "INV-2025-001", "Amount": 149.95, "Status": "Pending"}"""
                },

                // Payment received
                new()
                {
                    ActivityType = "Update",
                    EntityType = "Invoice",
                    EntityId = "inv-001",
                    UserId = "accounting@example.com",
                    UserName = "Accounting Manager",
                    Title = "Payment received",
                    Description = "Payment of $149.95 received for invoice #INV-2025-001",
                    Timestamp = baseTime.AddMinutes(-30),
                    Severity = "Success",
                    Icon = "DollarSign",
                    IpAddress = "192.168.1.103",
                    OldValues = """{"Status": "Pending", "PaidAmount": 0}""",
                    NewValues = """{"Status": "Paid", "PaidAmount": 149.95}"""
                },

                // Low stock warning
                new()
                {
                    ActivityType = "Warning",
                    EntityType = "Product",
                    EntityId = "prod-002",
                    UserId = "system",
                    UserName = "System",
                    Title = "Low stock alert",
                    Description = "Keyboard inventory is running low (5 units remaining)",
                    Timestamp = baseTime.AddMinutes(-15),
                    Severity = "Warning",
                    Icon = "AlertTriangle",
                    Metadata = """{"threshold": 10, "currentStock": 5}"""
                },

                // System backup
                new()
                {
                    ActivityType = "System",
                    EntityType = "System",
                    EntityId = "backup-001",
                    UserId = "system",
                    UserName = "System",
                    Title = "System backup completed",
                    Description = "Automated daily backup completed successfully",
                    Timestamp = baseTime.AddMinutes(-5),
                    Severity = "Info",
                    Icon = "Settings",
                    Metadata = """{"backupSize": "2.5GB", "duration": "45 minutes"}"""
                }
            };

            // Add audit logs to context
            await _context.AuditLogs.AddRangeAsync(auditLogs);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully seeded {Count} audit log entries", auditLogs.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding audit data");
        }
    }
}
