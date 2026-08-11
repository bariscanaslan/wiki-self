using WikiSelf.DTOs.Users;

namespace WikiSelf.Services;

public interface IUserService
{
    Task<IReadOnlyList<UserResponse>> GetAllAsync();
    Task<UserResponse> GetByIdAsync(Guid id);
    Task<UserResponse> CreateAsync(CreateUserRequest request);
    Task<UserResponse> UpdateAsync(Guid id, UpdateUserRequest request);
    Task SetActiveAsync(Guid id, SetUserActiveRequest request);
    Task<UserResponse> AssignGroupsAsync(Guid id, AssignUserGroupsRequest request);
    Task ResetPasswordAsync(Guid id, AdminResetPasswordRequest request);
    Task DeleteAsync(Guid id, Guid actingUserId, DeleteUserRequest request);
}
