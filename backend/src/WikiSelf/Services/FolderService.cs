using Microsoft.EntityFrameworkCore;
using WikiSelf.Data;
using WikiSelf.DTOs.Documents;
using WikiSelf.DTOs.Folders;
using WikiSelf.Entities;
using WikiSelf.Entities.Enums;
using WikiSelf.Services.Exceptions;

namespace WikiSelf.Services;

public class FolderService : IFolderService
{
    private readonly AppDbContext _db;
    private readonly IPermissionService _permissionService;

    public FolderService(AppDbContext db, IPermissionService permissionService)
    {
        _db = db;
        _permissionService = permissionService;
    }

    public async Task<IReadOnlyList<FolderTreeNodeResponse>> GetTreeAsync(Guid userId)
    {
        var folders = await _db.Folders.AsNoTracking().ToListAsync();
        var documents = await _db.Documents.AsNoTracking().Include(d => d.Folder).ToListAsync();

        var folderPermissions = await _permissionService.GetEffectiveFolderPermissionsAsync(userId, folders);
        var documentPermissions = await _permissionService.GetEffectiveDocumentPermissionsAsync(userId, documents);

        var visibleFolderIds = new HashSet<Guid>(folderPermissions.Keys);
        var accessibleDocuments = documents.Where(d => documentPermissions.ContainsKey(d.Id)).ToList();

        foreach (var document in accessibleDocuments)
        {
            visibleFolderIds.Add(document.FolderId);
        }

        var foldersById = folders.ToDictionary(f => f.Id);
        var ancestorsToAdd = new HashSet<Guid>();
        foreach (var folderId in visibleFolderIds)
        {
            var current = foldersById[folderId].ParentId;
            while (current.HasValue && foldersById.TryGetValue(current.Value, out var parent))
            {
                ancestorsToAdd.Add(parent.Id);
                current = parent.ParentId;
            }
        }

        visibleFolderIds.UnionWith(ancestorsToAdd);

        var documentsByFolder = accessibleDocuments
            .GroupBy(d => d.FolderId)
            .ToDictionary(g => g.Key, g => g.Select(d => new DocumentSummaryResponse(
                d.Id, d.Title, d.FolderId, d.CategoryId, d.CreatedAt, d.UpdatedAt)).ToList());

        var nodesById = new Dictionary<Guid, FolderTreeNodeResponse>();
        var childrenByParent = new Dictionary<Guid, List<FolderTreeNodeResponse>>();

        foreach (var folder in folders.Where(f => visibleFolderIds.Contains(f.Id)))
        {
            PermissionLevel? effectivePermission = folderPermissions.TryGetValue(folder.Id, out var level) ? level : null;

            var node = new FolderTreeNodeResponse(
                folder.Id,
                folder.Name,
                folder.ParentId,
                folder.MaterializedPath,
                folder.CreatedAt,
                effectivePermission,
                new List<FolderTreeNodeResponse>(),
                documentsByFolder.GetValueOrDefault(folder.Id) ?? new List<DocumentSummaryResponse>());

            nodesById[folder.Id] = node;

            if (folder.ParentId.HasValue)
            {
                if (!childrenByParent.TryGetValue(folder.ParentId.Value, out var siblings))
                {
                    siblings = new List<FolderTreeNodeResponse>();
                    childrenByParent[folder.ParentId.Value] = siblings;
                }

                siblings.Add(node);
            }
        }

        var roots = new List<FolderTreeNodeResponse>();
        foreach (var (id, node) in nodesById)
        {
            var children = childrenByParent.GetValueOrDefault(id) ?? new List<FolderTreeNodeResponse>();
            var mutableChildren = (List<FolderTreeNodeResponse>)node.Children;
            mutableChildren.AddRange(children.OrderBy(c => c.Name));
            if (node.ParentId is null || !nodesById.ContainsKey(node.ParentId.Value))
            {
                roots.Add(node);
            }
        }

        return roots.OrderBy(r => r.Name).ToList();
    }

    public async Task<FolderResponse> CreateAsync(Guid userId, CreateFolderRequest request)
    {
        Folder? parent = null;
        if (request.ParentId.HasValue)
        {
            parent = await _db.Folders.FirstOrDefaultAsync(f => f.Id == request.ParentId.Value)
                     ?? throw new NotFoundException("Parent folder not found.");
        }

        var siblingExists = await _db.Folders.AnyAsync(f => f.ParentId == request.ParentId && f.Name == request.Name);
        if (siblingExists)
        {
            throw new ConflictException("A folder with this name already exists in the target location.");
        }

        var folder = new Folder
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            ParentId = request.ParentId,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = userId
        };

        folder.MaterializedPath = (parent?.MaterializedPath ?? "/") + folder.Id + "/";

        _db.Folders.Add(folder);
        await _db.SaveChangesAsync();

        return new FolderResponse(folder.Id, folder.Name, folder.ParentId, folder.MaterializedPath, folder.CreatedAt, PermissionLevel.Manage);
    }

    public async Task<FolderResponse> RenameAsync(Guid folderId, RenameFolderRequest request)
    {
        var folder = await _db.Folders.FirstOrDefaultAsync(f => f.Id == folderId)
                     ?? throw new NotFoundException("Folder not found.");

        var siblingExists = await _db.Folders.AnyAsync(f =>
            f.ParentId == folder.ParentId && f.Name == request.Name && f.Id != folderId);

        if (siblingExists)
        {
            throw new ConflictException("A folder with this name already exists in this location.");
        }

        folder.Name = request.Name;
        await _db.SaveChangesAsync();

        return new FolderResponse(folder.Id, folder.Name, folder.ParentId, folder.MaterializedPath, folder.CreatedAt, null);
    }

    public async Task<FolderResponse> MoveAsync(Guid folderId, MoveFolderRequest request)
    {
        var folder = await _db.Folders.FirstOrDefaultAsync(f => f.Id == folderId)
                     ?? throw new NotFoundException("Folder not found.");

        if (request.NewParentId == folderId)
        {
            throw new BadRequestException("A folder cannot be moved into itself.");
        }

        Folder? newParent = null;
        if (request.NewParentId.HasValue)
        {
            newParent = await _db.Folders.FirstOrDefaultAsync(f => f.Id == request.NewParentId.Value)
                        ?? throw new NotFoundException("Target parent folder not found.");

            if (newParent.MaterializedPath.StartsWith(folder.MaterializedPath, StringComparison.Ordinal))
            {
                throw new BadRequestException("A folder cannot be moved into one of its own descendants.");
            }
        }

        var siblingExists = await _db.Folders.AnyAsync(f =>
            f.ParentId == request.NewParentId && f.Name == folder.Name && f.Id != folderId);

        if (siblingExists)
        {
            throw new ConflictException("A folder with this name already exists in the target location.");
        }

        var oldPathPrefix = folder.MaterializedPath;
        var newPathPrefix = (newParent?.MaterializedPath ?? "/") + folder.Id + "/";

        var descendants = await _db.Folders
            .Where(f => f.MaterializedPath.StartsWith(oldPathPrefix))
            .ToListAsync();

        foreach (var descendant in descendants)
        {
            descendant.MaterializedPath = newPathPrefix + descendant.MaterializedPath[oldPathPrefix.Length..];
        }

        folder.ParentId = request.NewParentId;
        folder.MaterializedPath = newPathPrefix;

        await _db.SaveChangesAsync();

        return new FolderResponse(folder.Id, folder.Name, folder.ParentId, folder.MaterializedPath, folder.CreatedAt, null);
    }

    public async Task DeleteAsync(Guid folderId)
    {
        var folder = await _db.Folders.FirstOrDefaultAsync(f => f.Id == folderId)
                     ?? throw new NotFoundException("Folder not found.");

        var hasChildren = await _db.Folders.AnyAsync(f => f.ParentId == folderId);
        var hasDocuments = await _db.Documents.AnyAsync(d => d.FolderId == folderId);

        if (hasChildren || hasDocuments)
        {
            throw new ConflictException("Folder must be empty before it can be deleted.");
        }

        _db.Folders.Remove(folder);
        await _db.SaveChangesAsync();
    }
}
