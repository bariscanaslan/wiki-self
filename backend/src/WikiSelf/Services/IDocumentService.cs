using WikiSelf.DTOs.Audit;
using WikiSelf.DTOs.Documents;

namespace WikiSelf.Services;

public interface IDocumentService
{
    Task<DocumentResponse> GetByIdAsync(Guid id, Guid userId);
    Task<DocumentResponse> CreateAsync(Guid userId, CreateDocumentRequest request);
    Task<DocumentResponse> SaveNewVersionAsync(Guid documentId, Guid userId, SaveDocumentRequest request);
    Task<IReadOnlyList<DocumentVersionResponse>> GetVersionHistoryAsync(Guid documentId);
    Task<DocumentVersionDetailResponse> GetVersionAsync(Guid documentId, Guid versionId);
    Task<DocumentResponse> RestoreVersionAsync(Guid documentId, Guid versionId, Guid userId);
    Task<DocumentResponse> AssignTagsAsync(Guid documentId, Guid userId, AssignDocumentTagsRequest request);
    Task<DocumentResponse> AssignCategoryAsync(Guid documentId, Guid userId, AssignDocumentCategoryRequest request);
    Task<DocumentResponse> MoveAsync(Guid documentId, Guid userId, MoveDocumentRequest request);
    Task DeleteAsync(Guid documentId, Guid userId);
    Task<ExportContentResponse> GetExportContentAsync(Guid documentId);
    Task LogExportAsync(Guid documentId, Guid userId, LogExportRequest request);
}
