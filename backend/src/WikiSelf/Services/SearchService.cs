using Microsoft.EntityFrameworkCore;
using WikiSelf.Data;
using WikiSelf.DTOs.Search;

namespace WikiSelf.Services;

public class SearchService : ISearchService
{
    private const int CandidatePoolSize = 500;
    private const int SnippetLength = 240;

    private readonly AppDbContext _db;
    private readonly IPermissionService _permissionService;

    public SearchService(AppDbContext db, IPermissionService permissionService)
    {
        _db = db;
        _permissionService = permissionService;
    }

    public async Task<SearchResponse> SearchAsync(Guid userId, string query, int page, int pageSize)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        if (string.IsNullOrWhiteSpace(query))
        {
            return new SearchResponse([], 0, page, pageSize);
        }

        var matches = await _db.Documents
            .AsNoTracking()
            .Include(d => d.Folder)
            .Where(d => d.SearchVector.Matches(EF.Functions.WebSearchToTsQuery("english", query)))
            .Select(d => new
            {
                Document = d,
                Rank = d.SearchVector.Rank(EF.Functions.WebSearchToTsQuery("english", query))
            })
            .OrderByDescending(x => x.Rank)
            .Take(CandidatePoolSize)
            .ToListAsync();

        var permissions = await _permissionService.GetEffectiveDocumentPermissionsAsync(
            userId, matches.Select(m => m.Document));

        var accessible = matches.Where(m => permissions.ContainsKey(m.Document.Id)).ToList();

        var pageItems = accessible
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new SearchResultItemResponse(
                m.Document.Id,
                m.Document.Title,
                BuildSnippet(m.Document.SearchContent),
                m.Document.FolderId,
                m.Rank))
            .ToList();

        return new SearchResponse(pageItems, accessible.Count, page, pageSize);
    }

    private static string BuildSnippet(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return string.Empty;
        }

        return content.Length <= SnippetLength ? content : content[..SnippetLength] + "...";
    }
}
