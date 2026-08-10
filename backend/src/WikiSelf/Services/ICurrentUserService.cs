namespace WikiSelf.Services;

public interface ICurrentUserService
{
    Guid UserId { get; }
    bool IsAdmin { get; }
    bool IsAuthenticated { get; }
}
