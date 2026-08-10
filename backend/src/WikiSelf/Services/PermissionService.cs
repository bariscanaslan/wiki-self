using Microsoft.EntityFrameworkCore;
using WikiSelf.Data;
using WikiSelf.DTOs.Permissions;
using WikiSelf.Entities;
using WikiSelf.Entities.Enums;
using WikiSelf.Services.Exceptions;

namespace WikiSelf.Services;

public class PermissionService : IPermissionService
{
    private readonly AppDbContext _db;

    public PermissionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Guid>> GetGroupIdsForUserAsync(Guid userId)
    {
        return await _db.UserGroups
            .Where(ug => ug.UserId == userId)
            .Select(ug => ug.GroupId)
            .ToListAsync();
    }

    private async Task<bool> IsAdminAsync(Guid userId)
    {
        return await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.IsAdmin)
            .FirstOrDefaultAsync();
    }

    private static IReadOnlyList<Guid> ParseAncestorChain(string materializedPath)
    {
        return materializedPath
            .Split('/', StringSplitOptions.RemoveEmptyEntries)
            .Select(Guid.Parse)
            .ToList();
    }

    public async Task<PermissionLevel?> GetEffectiveFolderPermissionAsync(Guid userId, Guid folderId)
    {
        if (await IsAdminAsync(userId))
        {
            return PermissionLevel.Manage;
        }

        var folder = await _db.Folders.AsNoTracking().FirstOrDefaultAsync(f => f.Id == folderId);
        if (folder is null)
        {
            throw new NotFoundException("Folder not found.");
        }

        var groupIds = await GetGroupIdsForUserAsync(userId);
        if (groupIds.Count == 0)
        {
            return null;
        }

        var chain = ParseAncestorChain(folder.MaterializedPath);

        var level = await _db.Permissions
            .Where(p => groupIds.Contains(p.GroupId)
                        && p.ResourceType == ResourceType.Folder
                        && chain.Contains(p.ResourceId))
            .Select(p => (PermissionLevel?)p.Level)
            .OrderByDescending(l => l)
            .FirstOrDefaultAsync();

        return level;
    }

    public async Task<PermissionLevel?> GetEffectiveDocumentPermissionAsync(Guid userId, Guid documentId)
    {
        if (await IsAdminAsync(userId))
        {
            return PermissionLevel.Manage;
        }

        var document = await _db.Documents
            .AsNoTracking()
            .Include(d => d.Folder)
            .FirstOrDefaultAsync(d => d.Id == documentId);

        if (document is null)
        {
            throw new NotFoundException("Document not found.");
        }

        var groupIds = await GetGroupIdsForUserAsync(userId);
        if (groupIds.Count == 0)
        {
            return null;
        }

        var chain = ParseAncestorChain(document.Folder.MaterializedPath);

        var level = await _db.Permissions
            .Where(p => groupIds.Contains(p.GroupId)
                        && ((p.ResourceType == ResourceType.Folder && chain.Contains(p.ResourceId))
                            || (p.ResourceType == ResourceType.Document && p.ResourceId == documentId)))
            .Select(p => (PermissionLevel?)p.Level)
            .OrderByDescending(l => l)
            .FirstOrDefaultAsync();

        return level;
    }

    public async Task<bool> HasFolderPermissionAsync(Guid userId, Guid folderId, PermissionLevel required)
    {
        var level = await GetEffectiveFolderPermissionAsync(userId, folderId);
        return level.HasValue && level.Value >= required;
    }

    public async Task<bool> HasDocumentPermissionAsync(Guid userId, Guid documentId, PermissionLevel required)
    {
        var level = await GetEffectiveDocumentPermissionAsync(userId, documentId);
        return level.HasValue && level.Value >= required;
    }

    public async Task<IReadOnlyDictionary<Guid, PermissionLevel>> GetEffectiveFolderPermissionsAsync(
        Guid userId, IEnumerable<Folder> folders)
    {
        var folderList = folders.ToList();
        var result = new Dictionary<Guid, PermissionLevel>();

        if (await IsAdminAsync(userId))
        {
            foreach (var folder in folderList)
            {
                result[folder.Id] = PermissionLevel.Manage;
            }

            return result;
        }

        var groupIds = await GetGroupIdsForUserAsync(userId);
        if (groupIds.Count == 0)
        {
            return result;
        }

        var chains = folderList.ToDictionary(f => f.Id, f => ParseAncestorChain(f.MaterializedPath));
        var allAncestorIds = chains.Values.SelectMany(c => c).Distinct().ToList();

        var grants = await _db.Permissions
            .Where(p => groupIds.Contains(p.GroupId)
                        && p.ResourceType == ResourceType.Folder
                        && allAncestorIds.Contains(p.ResourceId))
            .Select(p => new { p.ResourceId, p.Level })
            .ToListAsync();

        var grantsByResource = grants
            .GroupBy(g => g.ResourceId)
            .ToDictionary(g => g.Key, g => g.Max(x => x.Level));

        foreach (var folder in folderList)
        {
            var chain = chains[folder.Id];
            var best = chain
                .Where(grantsByResource.ContainsKey)
                .Select(id => grantsByResource[id])
                .DefaultIfEmpty()
                .Max();

            if (chain.Any(grantsByResource.ContainsKey))
            {
                result[folder.Id] = best;
            }
        }

        return result;
    }

    public async Task<IReadOnlyDictionary<Guid, PermissionLevel>> GetEffectiveDocumentPermissionsAsync(
        Guid userId, IEnumerable<Document> documents)
    {
        var documentList = documents.ToList();
        var result = new Dictionary<Guid, PermissionLevel>();

        if (await IsAdminAsync(userId))
        {
            foreach (var document in documentList)
            {
                result[document.Id] = PermissionLevel.Manage;
            }

            return result;
        }

        var groupIds = await GetGroupIdsForUserAsync(userId);
        if (groupIds.Count == 0)
        {
            return result;
        }

        var chains = documentList.ToDictionary(d => d.Id, d => ParseAncestorChain(d.Folder.MaterializedPath));
        var allAncestorIds = chains.Values.SelectMany(c => c).Distinct().ToList();
        var documentIds = documentList.Select(d => d.Id).ToList();

        var grants = await _db.Permissions
            .Where(p => groupIds.Contains(p.GroupId)
                        && ((p.ResourceType == ResourceType.Folder && allAncestorIds.Contains(p.ResourceId))
                            || (p.ResourceType == ResourceType.Document && documentIds.Contains(p.ResourceId))))
            .Select(p => new { p.ResourceType, p.ResourceId, p.Level })
            .ToListAsync();

        var folderGrants = grants
            .Where(g => g.ResourceType == ResourceType.Folder)
            .GroupBy(g => g.ResourceId)
            .ToDictionary(g => g.Key, g => g.Max(x => x.Level));

        var documentGrants = grants
            .Where(g => g.ResourceType == ResourceType.Document)
            .GroupBy(g => g.ResourceId)
            .ToDictionary(g => g.Key, g => g.Max(x => x.Level));

        foreach (var document in documentList)
        {
            var chain = chains[document.Id];
            var levels = new List<PermissionLevel>();

            levels.AddRange(chain.Where(folderGrants.ContainsKey).Select(id => folderGrants[id]));

            if (documentGrants.TryGetValue(document.Id, out var directLevel))
            {
                levels.Add(directLevel);
            }

            if (levels.Count > 0)
            {
                result[document.Id] = levels.Max();
            }
        }

        return result;
    }

    public async Task<IReadOnlyList<PermissionResponse>> GetPermissionsForResourceAsync(ResourceType resourceType, Guid resourceId)
    {
        return await _db.Permissions
            .AsNoTracking()
            .Include(p => p.Group)
            .Where(p => p.ResourceType == resourceType && p.ResourceId == resourceId)
            .Select(p => new PermissionResponse(p.Id, p.GroupId, p.Group.Name, p.ResourceType, p.ResourceId, p.Level))
            .ToListAsync();
    }

    public async Task<PermissionResponse> AssignPermissionAsync(AssignPermissionRequest request)
    {
        var group = await _db.Groups.FindAsync(request.GroupId)
                    ?? throw new NotFoundException("Group not found.");

        var existing = await _db.Permissions.FirstOrDefaultAsync(p =>
            p.GroupId == request.GroupId
            && p.ResourceType == request.ResourceType
            && p.ResourceId == request.ResourceId);

        if (existing is not null)
        {
            existing.Level = request.Level;
        }
        else
        {
            existing = new Permission
            {
                Id = Guid.NewGuid(),
                GroupId = request.GroupId,
                ResourceType = request.ResourceType,
                ResourceId = request.ResourceId,
                Level = request.Level
            };
            _db.Permissions.Add(existing);
        }

        await _db.SaveChangesAsync();

        return new PermissionResponse(existing.Id, existing.GroupId, group.Name, existing.ResourceType, existing.ResourceId, existing.Level);
    }

    public async Task RemovePermissionAsync(Guid permissionId)
    {
        var permission = await _db.Permissions.FindAsync(permissionId)
                          ?? throw new NotFoundException("Permission not found.");

        _db.Permissions.Remove(permission);
        await _db.SaveChangesAsync();
    }
}
