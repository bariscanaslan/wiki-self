using WikiSelf.DTOs.Groups;

namespace WikiSelf.DTOs.Users;

public record UserResponse(
    Guid Id,
    string Email,
    string DisplayName,
    bool IsAdmin,
    bool IsActive,
    DateTime CreatedAt,
    IReadOnlyList<GroupSummaryResponse> Groups,
    bool TwoFactorEnabled);

public record CreateUserRequest(string Email, string Password, string DisplayName, bool IsAdmin);

public record UpdateUserRequest(string DisplayName, bool IsAdmin);

public record SetUserActiveRequest(bool IsActive);

public record AssignUserGroupsRequest(IReadOnlyList<Guid> GroupIds);

public record AdminResetPasswordRequest(string NewPassword);

public record DeleteUserRequest(string Password);

public record UserSummaryResponse(Guid Id, string Email, string DisplayName);
