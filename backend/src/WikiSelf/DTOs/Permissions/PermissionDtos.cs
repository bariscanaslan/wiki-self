using WikiSelf.Entities.Enums;

namespace WikiSelf.DTOs.Permissions;

public record PermissionResponse(
    Guid Id,
    Guid GroupId,
    string GroupName,
    ResourceType ResourceType,
    Guid ResourceId,
    PermissionLevel Level);

public record AssignPermissionRequest(Guid GroupId, ResourceType ResourceType, Guid ResourceId, PermissionLevel Level);

public record EffectivePermissionResponse(ResourceType ResourceType, Guid ResourceId, PermissionLevel? Level);
