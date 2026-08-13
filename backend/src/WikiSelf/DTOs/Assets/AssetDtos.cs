using Microsoft.AspNetCore.Http;
using WikiSelf.Entities.Enums;

namespace WikiSelf.DTOs.Assets;

public record AssetResponse(Guid Id, string FileName, string ContentType, DateTime CreatedAt, string Url, Guid? DocumentId);

public class UploadAssetRequest
{
    public IFormFile File { get; set; } = null!;
    public Guid? DocumentId { get; set; }
}

public record ImageAssetResponse(
    Guid Id, string FileName, string Url, DateTime CreatedAt, Guid DocumentId, string DocumentTitle, PermissionLevel? EffectivePermission);

public record ImageAssetListResponse(IReadOnlyList<ImageAssetResponse> Items, int Total, int Page, int PageSize);
