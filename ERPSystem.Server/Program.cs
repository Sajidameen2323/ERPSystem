using ERPSystem.Server.Configuration;
using ERPSystem.Server.Data;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Services.Implementations;
using ERPSystem.Server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Okta.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Database Configuration
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure Okta settings
builder.Services.Configure<OktaSettings>(builder.Configuration.GetSection("Okta"));

// Register application services
builder.Services.AddScoped<IOktaService, OktaService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IPurchaseOrderReturnService, PurchaseOrderReturnService>();
builder.Services.AddScoped<ISalesOrderService, SalesOrderService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IInvoiceExportService, InvoiceExportService>();
builder.Services.AddScoped<IStockMovementService, StockMovementService>();

// Add Okta authentication for API protection
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddOktaWebApi(new OktaWebApiOptions()
    {
        OktaDomain = builder.Configuration["Okta:OktaDomain"],
        AuthorizationServerId = builder.Configuration["Okta:AuthorizationServerId"],
        Audience = builder.Configuration["Okta:Audience"]
    });

// Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(ERPSystem.Server.Common.Constants.Policies.AdminOnly, policy =>
        policy.RequireRole(ERPSystem.Server.Common.Constants.Roles.Admin));
    
    options.AddPolicy(ERPSystem.Server.Common.Constants.Policies.SalesAccess, policy =>
        policy.RequireRole(ERPSystem.Server.Common.Constants.Roles.Admin, ERPSystem.Server.Common.Constants.Roles.SalesUser));
    
    options.AddPolicy(ERPSystem.Server.Common.Constants.Policies.InventoryAccess, policy =>
        policy.RequireRole(ERPSystem.Server.Common.Constants.Roles.Admin, ERPSystem.Server.Common.Constants.Roles.InventoryUser));
        
    options.AddPolicy(ERPSystem.Server.Common.Constants.Policies.ERPAccess, policy =>
        policy.RequireRole(ERPSystem.Server.Common.Constants.Roles.Admin, 
                          ERPSystem.Server.Common.Constants.Roles.SalesUser,
                          ERPSystem.Server.Common.Constants.Roles.InventoryUser));
});

// HttpClient factory for making HTTP requests to Okta
builder.Services.AddHttpClient();

// AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("https://localhost:4200", "http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MicroBiz Hub API",
        Version = "v1",
        Description = "ERP System API for Small and Medium Enterprises"
    });

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

var app = builder.Build();

// Ensure database is created for application data (users managed in Okta)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    // Apply migrations for application data only
    await context.Database.MigrateAsync();
}

app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowAngularApp");

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();


