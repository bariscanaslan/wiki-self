namespace WikiSelf.Services.Exceptions;

public abstract class AppException : Exception
{
    protected AppException(string error, string message, object? details = null) : base(message)
    {
        Error = error;
        Details = details;
    }

    public string Error { get; }
    public object? Details { get; }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message, object? details = null) : base("not_found", message, details)
    {
    }
}

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "You do not have permission to perform this action.", object? details = null)
        : base("forbidden", message, details)
    {
    }
}

public class ConflictException : AppException
{
    public ConflictException(string message, object? details = null) : base("conflict", message, details)
    {
    }
}

public class BadRequestException : AppException
{
    public BadRequestException(string message, object? details = null) : base("bad_request", message, details)
    {
    }
}

public class UnauthorizedAppException : AppException
{
    public UnauthorizedAppException(string message = "Invalid credentials.", object? details = null)
        : base("unauthorized", message, details)
    {
    }
}
