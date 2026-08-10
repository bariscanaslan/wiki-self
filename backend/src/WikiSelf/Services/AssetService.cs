using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WikiSelf.Data;
using WikiSelf.DTOs.Assets;
using WikiSelf.Entities;
using WikiSelf.Services.Exceptions;
using WikiSelf.Services.Storage;

namespace WikiSelf.Services;

public class AssetService : IAssetService
{
    private readonly AppDbContext _db;
    private readonly string _rootPath;

    public AssetService(AppDbContext db, IOptions<AssetStorageSettings> storageSettings)
    {
        _db = db;
        _rootPath = Path.IsPathRooted(storageSettings.Value.RootPath)
            ? storageSettings.Value.RootPath
            : Path.Combine(AppContext.BaseDirectory, storageSettings.Value.RootPath);

        Directory.CreateDirectory(_rootPath);
    }

    private static AssetResponse ToResponse(Asset asset)
    {
        return new AssetResponse(asset.Id, asset.FileName, asset.ContentType, asset.CreatedAt, $"/api/assets/{asset.Id}/file", asset.DocumentId);
    }

    public async Task<AssetResponse> UploadAsync(Guid userId, IFormFile file, Guid? documentId)
    {
        if (file.Length == 0)
        {
            throw new BadRequestException("Uploaded file is empty.");
        }

        if (documentId.HasValue)
        {
            var documentExists = await _db.Documents.AnyAsync(d => d.Id == documentId.Value);
            if (!documentExists)
            {
                throw new NotFoundException("Document not found.");
            }
        }

        var asset = new Asset
        {
            Id = Guid.NewGuid(),
            FileName = file.FileName,
            ContentType = file.ContentType,
            UploadedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            DocumentId = documentId
        };

        var extension = Path.GetExtension(file.FileName);
        var storedFileName = $"{asset.Id}{extension}";
        asset.StoragePath = storedFileName;

        var fullPath = Path.Combine(_rootPath, storedFileName);
        await using (var stream = File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        _db.Assets.Add(asset);
        await _db.SaveChangesAsync();

        return ToResponse(asset);
    }

    public async Task<(Stream Stream, string ContentType, string FileName)> GetFileAsync(Guid id)
    {
        var asset = await _db.Assets.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id)
                    ?? throw new NotFoundException("Asset not found.");

        var fullPath = Path.Combine(_rootPath, asset.StoragePath);
        if (!File.Exists(fullPath))
        {
            throw new NotFoundException("Asset file not found on disk.");
        }

        var stream = File.OpenRead(fullPath);
        return (stream, asset.ContentType, asset.FileName);
    }

    public async Task<AssetResponse> GetMetadataAsync(Guid id)
    {
        var asset = await _db.Assets.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id)
                    ?? throw new NotFoundException("Asset not found.");

        return ToResponse(asset);
    }

    public async Task DeleteAsync(Guid id)
    {
        var asset = await _db.Assets.FirstOrDefaultAsync(a => a.Id == id)
                    ?? throw new NotFoundException("Asset not found.");

        var fullPath = Path.Combine(_rootPath, asset.StoragePath);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        _db.Assets.Remove(asset);
        await _db.SaveChangesAsync();
    }
}
