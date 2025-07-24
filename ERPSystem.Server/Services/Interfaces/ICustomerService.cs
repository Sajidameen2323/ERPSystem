using ERPSystem.Server.Common;
using ERPSystem.Server.DTOs.Sales;

namespace ERPSystem.Server.Services.Interfaces;

public interface ICustomerService
{
    Task<Result<PagedResult<CustomerDto>>> GetCustomersAsync(CustomerQueryParameters parameters);
    Task<Result<CustomerDto>> GetCustomerByIdAsync(Guid id);
    Task<Result<CustomerDto>> CreateCustomerAsync(CustomerCreateDto createDto);
    Task<Result<CustomerDto>> UpdateCustomerAsync(Guid id, CustomerUpdateDto updateDto);
    Task<Result<bool>> DeleteCustomerAsync(Guid id);
    Task<Result<bool>> RestoreCustomerAsync(Guid id);
    Task<bool> IsEmailUniqueAsync(string email, Guid? excludeCustomerId = null);
}
