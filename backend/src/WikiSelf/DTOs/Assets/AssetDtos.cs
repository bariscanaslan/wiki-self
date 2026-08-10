using Microsoft.AspNetCore.Http;

namespace WikiSelf.DTOs.Assets;

public record AssetResponse(Guid Id, string FileName, string ContentType, DateTime CreatedAt, string Url, Guid? DocumentId);

public class UploadAssetRequest
{
    public IFormFile File { get; set; } = null!;
    public Guid? DocumentId { get; set; }
}
