using ERPSystem.Server.Configuration;
using ERPSystem.Server.Data;
using ERPSystem.Server.Repositories.Implementations;
using ERPSystem.Server.Repositories.Interfaces;
using ERPSystem.Server.Services.Implementations;
using ERPSystem.Server.Services.Interfaces;
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

// Add Okta authentication for API protection
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddOktaWebApi(new OktaWebApiOptions()
    {
        OktaDomain = builder.Configuration["Okta:OktaDomain"],
        AuthorizationServerId = builder.Configuration["Okta:AuthorizationServerId"],
        Audience = builder.Configuration["Okta:Audience"]
    });

// Identity Configuration
//builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
//{
//    // Password settings
//    options.Password.RequireDigit = true;
//    options.Password.RequireLowercase = true;
//    options.Password.RequireNonAlphanumeric = true;
//    options.Password.RequireUppercase = true;
//    options.Password.RequiredLength = 8;
//    options.Password.RequiredUniqueChars = 1;

//    // Password settings
//    options.Password.RequireDigit = true;
//    options.Password.RequireLowercase = true;
//    options.Password.RequireNonAlphanumeric = true;
//    options.Password.RequireUppercase = true;
//    options.Password.RequiredLength = 8;
//    options.Password.RequiredUniqueChars = 1;

//    // Lockout settings
//    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
//    options.Lockout.MaxFailedAccessAttempts = 5;
//    options.Lockout.AllowedForNewUsers = true;

//    // User settings
//    options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
//    options.User.RequireUniqueEmail = true;

//    // Sign in settings
//    options.SignIn.RequireConfirmedEmail = false;
//    options.SignIn.RequireConfirmedPhoneNumber = false;
//})
//.AddEntityFrameworkStores<ApplicationDbContext>()
//.AddDefaultTokenProviders();

//// JWT Configuration
//var jwtSettings = builder.Configuration.GetSection("JwtSettings");
//builder.Services.Configure<JwtSettings>(jwtSettings);

//var secretKey = jwtSettings.Get<JwtSettings>()!.SecretKey;
//var key = Encoding.UTF8.GetBytes(secretKey);

//builder.Services.AddAuthentication(options =>
//{
//    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
//    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
//    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
//})
//.AddJwtBearer(options =>
//{
//    options.SaveToken = true;
//    options.RequireHttpsMetadata = false;
//    options.TokenValidationParameters = new TokenValidationParameters()
//    {
//        ValidateIssuer = true,
//        ValidateAudience = true,
//        ValidateLifetime = true,
//        ValidateIssuerSigningKey = true,
//        ClockSkew = TimeSpan.Zero,
//        ValidIssuer = jwtSettings["Issuer"],
//        ValidAudience = jwtSettings["Audience"],
//        IssuerSigningKey = new SymmetricSecurityKey(key)
//    };
//});

// Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(ERPSystem.Server.Common.Constants.Policies.AdminOnly, policy =>
        policy.RequireRole(ERPSystem.Server.Common.Constants.Roles.Admin));
    
    options.AddPolicy(ERPSystem.Server.Common.Constants.Policies.SalesAccess, policy =>
        policy.RequireRole(ERPSystem.Server.Common.Constants.Roles.Admin, ERPSystem.Server.Common.Constants.Roles.SalesUser));
    
    options.AddPolicy(ERPSystem.Server.Common.Constants.Policies.InventoryAccess, policy =>
        policy.RequireRole(ERPSystem.Server.Common.Constants.Roles.Admin, ERPSystem.Server.Common.Constants.Roles.InventoryUser));
});


// Repository Pattern
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Services
builder.Services.AddScoped<IOktaAuthService, OktaAuthService>();
builder.Services.AddScoped<IUserService, UserService>();
//builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// HttpClient for Okta API calls
builder.Services.AddHttpClient<OktaAuthService>();

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

// Ensure database is created (no seeding needed - users managed in Okta)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    // Apply migrations
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


