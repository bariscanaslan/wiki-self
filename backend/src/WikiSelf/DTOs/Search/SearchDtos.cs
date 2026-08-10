namespace WikiSelf.DTOs.Search;

public record SearchResultItemResponse(Guid DocumentId, string Title, string Snippet, Guid FolderId, float Rank);

public record SearchResponse(IReadOnlyList<SearchResultItemResponse> Results, int TotalCount, int Page, int PageSize);
