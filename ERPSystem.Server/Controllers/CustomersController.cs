using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ERPSystem.Server.DTOs.Sales;
using ERPSystem.Server.Services.Interfaces;
using ERPSystem.Server.Common;

namespace ERPSystem.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{Constants.Roles.Admin},{Constants.Roles.SalesUser}")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(ICustomerService customerService, ILogger<CustomersController> logger)
    {
        _customerService = customerService;
        _logger = logger;
    }

    /// <summary>
    /// Get all customers with optional filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetCustomers([FromQuery] CustomerQueryParameters parameters)
    {
        try
        {
            var result = await _customerService.GetCustomersAsync(parameters);
            
            if (!result.IsSuccess)
            {
                return BadRequest(Result<PagedResult<CustomerDto>>.Failure(result.Error));
            }

            return Ok(Result<PagedResult<CustomerDto>>.Success(result.Data!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving customers");
            return StatusCode(500, Result<PagedResult<CustomerDto>>.Failure("An error occurred while retrieving customers"));
        }
    }

    /// <summary>
    /// Get a specific customer by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCustomer(Guid id)
    {
        try
        {
            var result = await _customerService.GetCustomerByIdAsync(id);
            
            if (!result.IsSuccess)
            {
                if (result.Error.Contains("not found"))
                {
                    return NotFound(Result<CustomerDto>.Failure("Customer not found"));
                }
                return BadRequest(Result<CustomerDto>.Failure(result.Error));
            }

            return Ok(Result<CustomerDto>.Success(result.Data!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving customer with ID: {CustomerId}", id);
            return StatusCode(500, Result<CustomerDto>.Failure("An error occurred while retrieving the customer"));
        }
    }

    /// <summary>
    /// Create a new customer
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateCustomer([FromBody] CustomerCreateDto createDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);
                return BadRequest(Result<CustomerDto>.Failure(string.Join("; ", errors)));
            }

            var result = await _customerService.CreateCustomerAsync(createDto);
            
            if (!result.IsSuccess)
            {
                return BadRequest(Result<CustomerDto>.Failure(result.Error));
            }

            return CreatedAtAction(
                nameof(GetCustomer), 
                new { id = result.Data!.Id }, 
                Result<CustomerDto>.Success(result.Data!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating customer");
            return StatusCode(500, Result<CustomerDto>.Failure("An error occurred while creating the customer"));
        }
    }

    /// <summary>
    /// Update an existing customer
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCustomer(Guid id, [FromBody] CustomerUpdateDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);
                return BadRequest(Result<CustomerDto>.Failure(string.Join("; ", errors)));
            }

            var result = await _customerService.UpdateCustomerAsync(id, updateDto);
            
            if (!result.IsSuccess)
            {
                if (result.Error.Contains("not found"))
                {
                    return NotFound(Result<CustomerDto>.Failure("Customer not found"));
                }
                return BadRequest(Result<CustomerDto>.Failure(result.Error));
            }

            return Ok(Result<CustomerDto>.Success(result.Data!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating customer with ID: {CustomerId}", id);
            return StatusCode(500, Result<CustomerDto>.Failure("An error occurred while updating the customer"));
        }
    }

    /// <summary>
    /// Delete a customer (soft delete if has sales orders, hard delete otherwise)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCustomer(Guid id)
    {
        try
        {
            var result = await _customerService.DeleteCustomerAsync(id);
            
            if (!result.IsSuccess)
            {
                if (result.Error.Contains("not found"))
                {
                    return NotFound(Result<bool>.Failure("Customer not found"));
                }
                return BadRequest(Result<bool>.Failure(result.Error));
            }

            return Ok(Result<bool>.Success(result.Data));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting customer with ID: {CustomerId}", id);
            return StatusCode(500, Result<bool>.Failure("An error occurred while deleting the customer"));
        }
    }

    /// <summary>
    /// Restore a soft-deleted customer
    /// </summary>
    [HttpPost("{id}/restore")]
    public async Task<IActionResult> RestoreCustomer(Guid id)
    {
        try
        {
            var result = await _customerService.RestoreCustomerAsync(id);
            
            if (!result.IsSuccess)
            {
                if (result.Error.Contains("not found"))
                {
                    return NotFound(Result<bool>.Failure("Deleted customer not found"));
                }
                return BadRequest(Result<bool>.Failure(result.Error));
            }

            return Ok(Result<bool>.Success(result.Data));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring customer with ID: {CustomerId}", id);
            return StatusCode(500, Result<bool>.Failure("An error occurred while restoring the customer"));
        }
    }

    /// <summary>
    /// Check if email is unique
    /// </summary>
    [HttpGet("check-email-unique")]
    public async Task<IActionResult> CheckEmailUnique([FromQuery] string email, [FromQuery] Guid? excludeCustomerId = null)
    {
        try
        {
            var isUnique = await _customerService.IsEmailUniqueAsync(email, excludeCustomerId);
            return Ok(Result<bool>.Success(isUnique));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking email uniqueness for: {Email}", email);
            return StatusCode(500, Result<bool>.Failure("An error occurred while checking email uniqueness"));
        }
    }
}
