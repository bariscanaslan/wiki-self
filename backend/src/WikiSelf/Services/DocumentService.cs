using Microsoft.EntityFrameworkCore;
using WikiSelf.Data;
using WikiSelf.DTOs.Assets;
using WikiSelf.DTOs.Audit;
using WikiSelf.DTOs.Documents;
using WikiSelf.DTOs.Tags;
using WikiSelf.Entities;
using WikiSelf.Entities.Enums;
using WikiSelf.Services.Exceptions;

namespace WikiSelf.Services;

public class DocumentService : IDocumentService
{
    private const int MaxRetainedVersions = 5;

    private readonly AppDbContext _db;
    private readonly IAuditService _auditService;
    private readonly IPermissionService _permissionService;

    public DocumentService(AppDbContext db, IAuditService auditService, IPermissionService permissionService)
    {
        _db = db;
        _auditService = auditService;
        _permissionService = permissionService;
    }

    private static IQueryable<Document> WithIncludes(IQueryable<Document> query)
    {
        return query
            .Include(d => d.CurrentVersion)
            .Include(d => d.CreatedByUser)
            .Include(d => d.DocumentTags).ThenInclude(dt => dt.Tag);
    }

    private async Task PruneOldVersionsAsync(Guid documentId)
    {
        var staleVersionIds = await _db.DocumentVersions
            .Where(v => v.DocumentId == documentId)
            .OrderByDescending(v => v.VersionNumber)
            .Skip(MaxRetainedVersions)
            .Select(v => v.Id)
            .ToListAsync();

        if (staleVersionIds.Count == 0)
        {
            return;
        }

        await _db.DocumentVersions
            .Where(v => staleVersionIds.Contains(v.Id))
            .ExecuteDeleteAsync();
    }

    private async Task<DocumentResponse> ToResponseAsync(Document document, Guid userId)
    {
        var effectivePermission = await _permissionService.GetEffectiveDocumentPermissionAsync(userId, document.Id)
                                   ?? PermissionLevel.View;

        return new DocumentResponse(
            document.Id,
            document.Title,
            document.FolderId,
            document.CategoryId,
            document.CurrentVersion?.ContentJson ?? string.Empty,
            document.CurrentVersion?.ContentMarkdown ?? string.Empty,
            document.CurrentVersion?.VersionNumber ?? 0,
            document.DocumentTags.Select(dt => new TagResponse(dt.Tag.Id, dt.Tag.Name)).ToList(),
            document.CreatedAt,
            document.CreatedByUserId,
            document.CreatedByUser.DisplayName,
            document.UpdatedAt,
            effectivePermission);
    }

    public async Task<DocumentResponse> GetByIdAsync(Guid id, Guid userId)
    {
        var document = await WithIncludes(_db.Documents.AsNoTracking())
            .FirstOrDefaultAsync(d => d.Id == id)
            ?? throw new NotFoundException("Document not found.");

        await _auditService.LogAsync(userId, AuditAction.View, ResourceType.Document, document.Id);

        return await ToResponseAsync(document, userId);
    }

    public async Task<DocumentResponse> CreateAsync(Guid userId, CreateDocumentRequest request)
    {
        var folderExists = await _db.Folders.AnyAsync(f => f.Id == request.FolderId);
        if (!folderExists)
        {
            throw new NotFoundException("Folder not found.");
        }

        if (request.CategoryId.HasValue)
        {
            var categoryExists = await _db.Categories.AnyAsync(c => c.Id == request.CategoryId.Value);
            if (!categoryExists)
            {
                throw new NotFoundException("Category not found.");
            }
        }

        var document = new Document
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            FolderId = request.FolderId,
            CategoryId = request.CategoryId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = userId,
            SearchContent = request.ContentMarkdown
        };

        var version = new DocumentVersion
        {
            Id = Guid.NewGuid(),
            DocumentId = document.Id,
            ContentJson = request.ContentJson,
            ContentMarkdown = request.ContentMarkdown,
            AuthorUserId = userId,
            CreatedAt = DateTime.UtcNow,
            VersionNumber = 1
        };

        _db.Documents.Add(document);
        _db.DocumentVersions.Add(version);

        if (request.TagIds is { Count: > 0 })
        {
            var validTagIds = await _db.Tags.Where(t => request.TagIds.Contains(t.Id)).Select(t => t.Id).ToListAsync();
            foreach (var tagId in validTagIds)
            {
                _db.DocumentTags.Add(new DocumentTag { DocumentId = document.Id, TagId = tagId });
            }
        }

        await _db.SaveChangesAsync();

        document.CurrentVersionId = version.Id;
        await _db.SaveChangesAsync();

        await _auditService.LogAsync(userId, AuditAction.Create, ResourceType.Document, document.Id, version.Id);

        var created = await WithIncludes(_db.Documents.AsNoTracking()).FirstAsync(d => d.Id == document.Id);
        return await ToResponseAsync(created, userId);
    }

    public async Task<DocumentResponse> SaveNewVersionAsync(Guid documentId, Guid userId, SaveDocumentRequest request)
    {
        var document = await _db.Documents.FirstOrDefaultAsync(d => d.Id == documentId)
                        ?? throw new NotFoundException("Document not found.");

        var maxVersionNumber = await _db.DocumentVersions
            .Where(v => v.DocumentId == documentId)
            .Select(v => (int?)v.VersionNumber)
            .MaxAsync() ?? 0;

        var version = new DocumentVersion
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            ContentJson = request.ContentJson,
            ContentMarkdown = request.ContentMarkdown,
            AuthorUserId = userId,
            CreatedAt = DateTime.UtcNow,
            VersionNumber = maxVersionNumber + 1
        };

        _db.DocumentVersions.Add(version);

        document.Title = request.Title;
        document.CurrentVersionId = version.Id;
        document.UpdatedAt = DateTime.UtcNow;
        document.SearchContent = request.ContentMarkdown;

        await _db.SaveChangesAsync();
        await PruneOldVersionsAsync(documentId);
        await _auditService.LogAsync(userId, AuditAction.Update, ResourceType.Document, documentId, version.Id);

        var updated = await WithIncludes(_db.Documents.AsNoTracking()).FirstAsync(d => d.Id == documentId);
        return await ToResponseAsync(updated, userId);
    }

    public async Task<IReadOnlyList<DocumentVersionResponse>> GetVersionHistoryAsync(Guid documentId)
    {
        var documentExists = await _db.Documents.AnyAsync(d => d.Id == documentId);
        if (!documentExists)
        {
            throw new NotFoundException("Document not found.");
        }

        return await _db.DocumentVersions
            .AsNoTracking()
            .Include(v => v.AuthorUser)
            .Where(v => v.DocumentId == documentId)
            .OrderByDescending(v => v.VersionNumber)
            .Select(v => new DocumentVersionResponse(v.Id, v.VersionNumber, v.CreatedAt, v.AuthorUserId, v.AuthorUser.DisplayName))
            .ToListAsync();
    }

    public async Task<DocumentVersionDetailResponse> GetVersionAsync(Guid documentId, Guid versionId)
    {
        var version = await _db.DocumentVersions
            .AsNoTracking()
            .Include(v => v.AuthorUser)
            .FirstOrDefaultAsync(v => v.Id == versionId && v.DocumentId == documentId)
            ?? throw new NotFoundException("Document version not found.");

        return new DocumentVersionDetailResponse(
            version.Id,
            version.VersionNumber,
            version.CreatedAt,
            version.AuthorUserId,
            version.AuthorUser.DisplayName,
            version.ContentJson,
            version.ContentMarkdown);
    }

    public async Task<DocumentResponse> RestoreVersionAsync(Guid documentId, Guid versionId, Guid userId)
    {
        var document = await _db.Documents.FirstOrDefaultAsync(d => d.Id == documentId)
                        ?? throw new NotFoundException("Document not found.");

        var targetVersion = await _db.DocumentVersions
            .FirstOrDefaultAsync(v => v.Id == versionId && v.DocumentId == documentId)
            ?? throw new NotFoundException("Document version not found.");

        var maxVersionNumber = await _db.DocumentVersions
            .Where(v => v.DocumentId == documentId)
            .Select(v => (int?)v.VersionNumber)
            .MaxAsync() ?? 0;

        var newVersion = new DocumentVersion
        {
            Id = Guid.NewGuid(),
            DocumentId = documentId,
            ContentJson = targetVersion.ContentJson,
            ContentMarkdown = targetVersion.ContentMarkdown,
            AuthorUserId = userId,
            CreatedAt = DateTime.UtcNow,
            VersionNumber = maxVersionNumber + 1
        };

        _db.DocumentVersions.Add(newVersion);

        document.CurrentVersionId = newVersion.Id;
        document.UpdatedAt = DateTime.UtcNow;
        document.SearchContent = targetVersion.ContentMarkdown;

        await _db.SaveChangesAsync();
        await PruneOldVersionsAsync(documentId);
        await _auditService.LogAsync(
            userId,
            AuditAction.Update,
            ResourceType.Document,
            documentId,
            newVersion.Id,
            new { restoredFromVersionId = versionId });

        var updated = await WithIncludes(_db.Documents.AsNoTracking()).FirstAsync(d => d.Id == documentId);
        return await ToResponseAsync(updated, userId);
    }

    public async Task<DocumentResponse> AssignTagsAsync(Guid documentId, Guid userId, AssignDocumentTagsRequest request)
    {
        var document = await _db.Documents
            .Include(d => d.DocumentTags)
            .FirstOrDefaultAsync(d => d.Id == documentId)
            ?? throw new NotFoundException("Document not found.");

        var validTagIds = await _db.Tags.Where(t => request.TagIds.Contains(t.Id)).Select(t => t.Id).ToListAsync();

        document.DocumentTags.Clear();
        foreach (var tagId in validTagIds)
        {
            document.DocumentTags.Add(new DocumentTag { DocumentId = documentId, TagId = tagId });
        }

        await _db.SaveChangesAsync();

        var updated = await WithIncludes(_db.Documents.AsNoTracking()).FirstAsync(d => d.Id == documentId);
        return await ToResponseAsync(updated, userId);
    }

    public async Task<DocumentResponse> AssignCategoryAsync(Guid documentId, Guid userId, AssignDocumentCategoryRequest request)
    {
        var document = await _db.Documents.FirstOrDefaultAsync(d => d.Id == documentId)
                        ?? throw new NotFoundException("Document not found.");

        if (request.CategoryId.HasValue)
        {
            var categoryExists = await _db.Categories.AnyAsync(c => c.Id == request.CategoryId.Value);
            if (!categoryExists)
            {
                throw new NotFoundException("Category not found.");
            }
        }

        document.CategoryId = request.CategoryId;
        await _db.SaveChangesAsync();

        var updated = await WithIncludes(_db.Documents.AsNoTracking()).FirstAsync(d => d.Id == documentId);
        return await ToResponseAsync(updated, userId);
    }

    public async Task<DocumentResponse> MoveAsync(Guid documentId, Guid userId, MoveDocumentRequest request)
    {
        var document = await _db.Documents.FirstOrDefaultAsync(d => d.Id == documentId)
                        ?? throw new NotFoundException("Document not found.");

        var folderExists = await _db.Folders.AnyAsync(f => f.Id == request.FolderId);
        if (!folderExists)
        {
            throw new NotFoundException("Folder not found.");
        }

        document.FolderId = request.FolderId;
        await _db.SaveChangesAsync();

        var updated = await WithIncludes(_db.Documents.AsNoTracking()).FirstAsync(d => d.Id == documentId);
        return await ToResponseAsync(updated, userId);
    }

    public async Task DeleteAsync(Guid documentId, Guid userId)
    {
        var document = await _db.Documents.FirstOrDefaultAsync(d => d.Id == documentId)
                        ?? throw new NotFoundException("Document not found.");

        // Audit log entries reference documents loosely (ResourceId, no foreign key), so they never
        // blocked deletion — but clear them out too, so no dangling history points at a deleted document.
        await _db.AuditLogs
            .Where(a => a.ResourceType == ResourceType.Document && a.ResourceId == documentId)
            .ExecuteDeleteAsync();

        _db.Documents.Remove(document);
        await _db.SaveChangesAsync();

        await _auditService.LogAsync(userId, AuditAction.Delete, ResourceType.Document, documentId);
    }

    public async Task<ExportContentResponse> GetExportContentAsync(Guid documentId)
    {
        var document = await _db.Documents
            .AsNoTracking()
            .Include(d => d.CurrentVersion)
            .Include(d => d.Assets)
            .FirstOrDefaultAsync(d => d.Id == documentId)
            ?? throw new NotFoundException("Document not found.");

        var settings = await _db.SiteSettings.AsNoTracking().FirstAsync(s => s.Id == 1);

        var assets = document.Assets
            .Select(a => new AssetResponse(a.Id, a.FileName, a.ContentType, a.CreatedAt, $"/api/assets/{a.Id}/file", a.DocumentId))
            .ToList();

        return new ExportContentResponse(
            document.Id,
            document.Title,
            document.CurrentVersion?.ContentJson ?? string.Empty,
            document.CurrentVersion?.ContentMarkdown ?? string.Empty,
            settings.DocumentFont,
            assets);
    }

    public async Task LogExportAsync(Guid documentId, Guid userId, LogExportRequest request)
    {
        var documentExists = await _db.Documents.AnyAsync(d => d.Id == documentId);
        if (!documentExists)
        {
            throw new NotFoundException("Document not found.");
        }

        await _auditService.LogAsync(
            userId,
            AuditAction.Export,
            ResourceType.Document,
            documentId,
            details: new { format = request.Format });
    }
}
