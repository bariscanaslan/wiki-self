using WikiSelf.DTOs.Permissions;
using WikiSelf.Entities;
using WikiSelf.Entities.Enums;

namespace WikiSelf.Services;

public interface IPermissionService
{
    Task<PermissionLevel?> GetEffectiveFolderPermissionAsync(Guid userId, Guid folderId);
    Task<PermissionLevel?> GetEffectiveDocumentPermissionAsync(Guid userId, Guid documentId);
    Task<bool> HasFolderPermissionAsync(Guid userId, Guid folderId, PermissionLevel required);
    Task<bool> HasDocumentPermissionAsync(Guid userId, Guid documentId, PermissionLevel required);

    Task<IReadOnlyDictionary<Guid, PermissionLevel>> GetEffectiveFolderPermissionsAsync(
        Guid userId, IEnumerable<Folder> folders);

    Task<IReadOnlyDictionary<Guid, PermissionLevel>> GetEffectiveDocumentPermissionsAsync(
        Guid userId, IEnumerable<Document> documents);

    Task<IReadOnlyList<Guid>> GetGroupIdsForUserAsync(Guid userId);

    Task<IReadOnlyList<PermissionResponse>> GetPermissionsForResourceAsync(ResourceType resourceType, Guid resourceId);
    Task<PermissionResponse> AssignPermissionAsync(AssignPermissionRequest request);
    Task RemovePermissionAsync(Guid permissionId);
}
