using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Server.Data;
using ERPSystem.Server.Models;
using ERPSystem.Server.DTOs.Sales;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Common;

namespace ERPSystem.Server.Services.Implementations;

public class CustomerService : ICustomerService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<CustomerService> _logger;

    public CustomerService(ApplicationDbContext context, IMapper mapper, ILogger<CustomerService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<Result<PagedResult<CustomerDto>>> GetCustomersAsync(CustomerQueryParameters parameters)
    {
        try
        {
            var query = _context.Customers.AsQueryable();

            // Handle soft delete filter based on parameters
            if (parameters.OnlyInactive)
            {
                // Show only inactive (soft deleted) customers
                query = query.IgnoreQueryFilters().Where(c => c.IsDeleted);
            }
            else if (parameters.IncludeDeleted)
            {
                // Include both active and inactive customers
                query = query.IgnoreQueryFilters();
            }
            // If neither flag is set, rely on global query filters to show only active customers

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
            {
                var searchTerm = parameters.SearchTerm.ToLower();
                query = query.Where(c =>
                    c.Name.ToLower().Contains(searchTerm) ||
                    (c.Email != null && c.Email.ToLower().Contains(searchTerm)) ||
                    (c.Phone != null && c.Phone.Contains(searchTerm)));
            }

            // Apply sorting
            query = parameters.SortBy?.ToLower() switch
            {
                "email" => parameters.SortDescending ? query.OrderByDescending(c => c.Email) : query.OrderBy(c => c.Email),
                "phone" => parameters.SortDescending ? query.OrderByDescending(c => c.Phone) : query.OrderBy(c => c.Phone),
                "createdat" => parameters.SortDescending ? query.OrderByDescending(c => c.CreatedAt) : query.OrderBy(c => c.CreatedAt),
                "updatedat" => parameters.SortDescending ? query.OrderByDescending(c => c.UpdatedAt) : query.OrderBy(c => c.UpdatedAt),
                _ => parameters.SortDescending ? query.OrderByDescending(c => c.Name) : query.OrderBy(c => c.Name)
            };

            var totalCount = await query.CountAsync();
            var customers = await query
                .Skip((parameters.Page - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var customerDtos = _mapper.Map<List<CustomerDto>>(customers);

            var pagedResult = new PagedResult<CustomerDto>
            {
                Items = customerDtos,
                TotalCount = totalCount,
                CurrentPage = parameters.Page,
                PageSize = parameters.PageSize
            };

            return Result<PagedResult<CustomerDto>>.Success(pagedResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving customers with parameters: {@Parameters}", parameters);
            return Result<PagedResult<CustomerDto>>.Failure("An error occurred while retrieving customers");
        }
    }

    public async Task<Result<CustomerDto>> GetCustomerByIdAsync(Guid id)
    {
        try
        {
            var customer = await _context.Customers
                .IgnoreQueryFilters() // Ensure we can retrieve soft deleted customers if needed
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return Result<CustomerDto>.Failure("Customer not found");
            }

            var customerDto = _mapper.Map<CustomerDto>(customer);
            return Result<CustomerDto>.Success(customerDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving customer with ID: {CustomerId}", id);
            return Result<CustomerDto>.Failure("Error retrieving customer");
        }
    }

    public async Task<Result<CustomerDto>> CreateCustomerAsync(CustomerCreateDto createDto)
    {
        try
        {
            // Check if email is unique (if provided)
            if (!string.IsNullOrWhiteSpace(createDto.Email))
            {
                var emailExists = await IsEmailUniqueAsync(createDto.Email);
                if (!emailExists)
                {
                    return Result<CustomerDto>.Failure("Email already exists");
                }
            }

            var customer = _mapper.Map<Customer>(createDto);
            customer.Id = Guid.NewGuid();

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            var customerDto = _mapper.Map<CustomerDto>(customer);
            _logger.LogInformation("Customer created successfully with ID: {CustomerId}", customer.Id);

            return Result<CustomerDto>.Success(customerDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating customer: {@CustomerData}", createDto);
            return Result<CustomerDto>.Failure("Error creating customer");
        }
    }

    public async Task<Result<CustomerDto>> UpdateCustomerAsync(Guid id, CustomerUpdateDto updateDto)
    {
        try
        {
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return Result<CustomerDto>.Failure("Customer not found");
            }

            // Check if email is unique (if provided and changed)
            if (!string.IsNullOrWhiteSpace(updateDto.Email) && updateDto.Email != customer.Email)
            {
                var emailExists = await IsEmailUniqueAsync(updateDto.Email, id);
                if (!emailExists)
                {
                    return Result<CustomerDto>.Failure("Email already exists");
                }
            }

            _mapper.Map(updateDto, customer);
            customer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var customerDto = _mapper.Map<CustomerDto>(customer);
            _logger.LogInformation("Customer updated successfully with ID: {CustomerId}", customer.Id);

            return Result<CustomerDto>.Success(customerDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating customer with ID: {CustomerId}", id);
            return Result<CustomerDto>.Failure("Error updating customer");
        }
    }

    public async Task<Result<bool>> DeleteCustomerAsync(Guid id)
    {
        try
        {
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return Result<bool>.Failure("Customer not found");
            }


            // Perform soft delete due to referential integrity
            customer.IsDeleted = true;
            customer.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Customer soft deleted with ID: {CustomerId} due to existing sales orders", customer.Id);
            return Result<bool>.Success(true);


        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting customer with ID: {CustomerId}", id);
            return Result<bool>.Failure("Error deleting customer");
        }
    }

    public async Task<Result<bool>> RestoreCustomerAsync(Guid id)
    {
        try
        {
            var customer = await _context.Customers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.Id == id && c.IsDeleted);

            if (customer == null)
            {
                return Result<bool>.Failure("Deleted customer not found");
            }

            customer.IsDeleted = false;
            customer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Customer restored with ID: {CustomerId}", customer.Id);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring customer with ID: {CustomerId}", id);
            return Result<bool>.Failure("Error restoring customer");
        }
    }

    public async Task<bool> IsEmailUniqueAsync(string email, Guid? excludeCustomerId = null)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return true;
        }

        // Use global query filters - automatically excludes soft deleted customers
        var query = _context.Customers.Where(c => c.Email == email);

        if (excludeCustomerId.HasValue)
        {
            query = query.Where(c => c.Id != excludeCustomerId.Value);
        }

        return !await query.AnyAsync();
    }
}
