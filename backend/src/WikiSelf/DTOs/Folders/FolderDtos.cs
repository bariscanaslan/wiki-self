using WikiSelf.DTOs.Documents;
using WikiSelf.Entities.Enums;

namespace WikiSelf.DTOs.Folders;

public record FolderResponse(
    Guid Id,
    string Name,
    Guid? ParentId,
    string MaterializedPath,
    string? Icon,
    DateTime CreatedAt,
    PermissionLevel? EffectivePermission);

public record FolderTreeNodeResponse(
    Guid Id,
    string Name,
    Guid? ParentId,
    string MaterializedPath,
    string? Icon,
    DateTime CreatedAt,
    PermissionLevel? EffectivePermission,
    IReadOnlyList<FolderTreeNodeResponse> Children,
    IReadOnlyList<DocumentSummaryResponse> Documents);

public record CreateFolderRequest(string Name, Guid? ParentId);

public record RenameFolderRequest(string Name);

public record MoveFolderRequest(Guid? NewParentId);

public record UpdateFolderIconRequest(string Icon);
