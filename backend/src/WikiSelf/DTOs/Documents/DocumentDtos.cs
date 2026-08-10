using WikiSelf.DTOs.Assets;
using WikiSelf.DTOs.Tags;
using WikiSelf.Entities.Enums;

namespace WikiSelf.DTOs.Documents;

public record DocumentSummaryResponse(
    Guid Id,
    string Title,
    Guid FolderId,
    Guid? CategoryId,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record DocumentResponse(
    Guid Id,
    string Title,
    Guid FolderId,
    Guid? CategoryId,
    string ContentJson,
    string ContentMarkdown,
    int VersionNumber,
    IReadOnlyList<TagResponse> Tags,
    DateTime CreatedAt,
    Guid CreatedByUserId,
    string CreatedByDisplayName,
    DateTime UpdatedAt,
    PermissionLevel EffectivePermission);

public record CreateDocumentRequest(
    string Title,
    Guid FolderId,
    string ContentJson,
    string ContentMarkdown,
    Guid? CategoryId,
    IReadOnlyList<Guid>? TagIds);

public record SaveDocumentRequest(string Title, string ContentJson, string ContentMarkdown);

public record MoveDocumentRequest(Guid FolderId);

public record AssignDocumentTagsRequest(IReadOnlyList<Guid> TagIds);

public record AssignDocumentCategoryRequest(Guid? CategoryId);

public record DocumentVersionResponse(
    Guid Id,
    int VersionNumber,
    DateTime CreatedAt,
    Guid AuthorUserId,
    string AuthorDisplayName);

public record DocumentVersionDetailResponse(
    Guid Id,
    int VersionNumber,
    DateTime CreatedAt,
    Guid AuthorUserId,
    string AuthorDisplayName,
    string ContentJson,
    string ContentMarkdown);

public record ExportContentResponse(
    Guid DocumentId,
    string Title,
    string ContentJson,
    string ContentMarkdown,
    string DocumentFont,
    IReadOnlyList<AssetResponse> Assets);
