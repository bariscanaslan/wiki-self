using WikiSelf.DTOs.Search;

namespace WikiSelf.Services;

public interface ISearchService
{
    Task<SearchResponse> SearchAsync(Guid userId, string query, int page, int pageSize);
}
