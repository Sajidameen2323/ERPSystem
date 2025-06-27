namespace ERPSystem.Server.Common;

public class Result
{
    public bool IsSuccess { get; private set; }
    public string Error { get; private set; } = string.Empty;

    protected Result(bool isSuccess, string error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }

    public static Result Success() => new(true, string.Empty);
    public static Result Failure(string error) => new(false, error);
}

public class Result<T> : Result
{
    public T? Data { get; private set; }

    private Result(bool isSuccess, string error, T? data = default) : base(isSuccess, error)
    {
        Data = data;
    }

    public static Result<T> Success(T data) => new(true, string.Empty, data);
    public static new Result<T> Failure(string error) => new(false, error);
}
