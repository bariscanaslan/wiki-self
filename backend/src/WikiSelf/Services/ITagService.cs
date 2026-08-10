using WikiSelf.DTOs.Tags;

namespace WikiSelf.Services;

public interface ITagService
{
    Task<IReadOnlyList<TagResponse>> GetAllAsync();
    Task<TagResponse> CreateAsync(CreateTagRequest request);
    Task<TagResponse> UpdateAsync(Guid id, UpdateTagRequest request);
    Task DeleteAsync(Guid id);
}
