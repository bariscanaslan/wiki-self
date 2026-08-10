using WikiSelf.DTOs.Groups;

namespace WikiSelf.Services;

public interface IGroupService
{
    Task<IReadOnlyList<GroupResponse>> GetAllAsync();
    Task<GroupDetailResponse> GetByIdAsync(Guid id);
    Task<GroupResponse> CreateAsync(CreateGroupRequest request);
    Task<GroupResponse> UpdateAsync(Guid id, UpdateGroupRequest request);
    Task DeleteAsync(Guid id);
    Task<GroupDetailResponse> UpdateMembersAsync(Guid id, UpdateGroupMembersRequest request);
}
