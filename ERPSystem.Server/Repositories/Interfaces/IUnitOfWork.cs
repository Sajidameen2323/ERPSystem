namespace ERPSystem.Server.Repositories.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}
