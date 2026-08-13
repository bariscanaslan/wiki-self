using Microsoft.AspNetCore.Http;
using WikiSelf.DTOs.Assets;

namespace WikiSelf.Services;

public interface IAssetService
{
    Task<AssetResponse> UploadAsync(Guid userId, IFormFile file, Guid? documentId);
    Task<(Stream Stream, string ContentType, string FileName)> GetFileAsync(Guid id);
    Task<AssetResponse> GetMetadataAsync(Guid id);
    Task<ImageAssetListResponse> GetImageAssetsAsync(Guid userId, int page, int pageSize);
    Task DeleteAsync(Guid id);
}
