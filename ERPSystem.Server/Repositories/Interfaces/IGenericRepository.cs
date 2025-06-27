using System.Linq.Expressions;

namespace ERPSystem.Server.Repositories.Interfaces;

public interface IGenericRepository<T> where T : class
{
    Task<T?> GetByIdAsync(object id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> expression);
    Task<T?> FindSingleAsync(Expression<Func<T, bool>> expression);
    Task AddAsync(T entity);
    Task AddRangeAsync(IEnumerable<T> entities);
    void Update(T entity);
    void UpdateRange(IEnumerable<T> entities);
    void Remove(T entity);
    void RemoveRange(IEnumerable<T> entities);
    Task<int> CountAsync(Expression<Func<T, bool>>? expression = null);
    Task<bool> ExistsAsync(Expression<Func<T, bool>> expression);
}
