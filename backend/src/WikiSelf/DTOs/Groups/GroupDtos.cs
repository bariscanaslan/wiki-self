using WikiSelf.DTOs.Users;

namespace WikiSelf.DTOs.Groups;

public record GroupSummaryResponse(Guid Id, string Name);

public record GroupResponse(Guid Id, string Name, string? Description, int MemberCount);

public record GroupDetailResponse(Guid Id, string Name, string? Description, IReadOnlyList<UserSummaryResponse> Members);

public record CreateGroupRequest(string Name, string? Description);

public record UpdateGroupRequest(string Name, string? Description);

public record UpdateGroupMembersRequest(IReadOnlyList<Guid> UserIds);
