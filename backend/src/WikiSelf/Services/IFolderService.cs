using WikiSelf.DTOs.Folders;

namespace WikiSelf.Services;

public interface IFolderService
{
    Task<IReadOnlyList<FolderTreeNodeResponse>> GetTreeAsync(Guid userId);
    Task<FolderResponse> CreateAsync(Guid userId, CreateFolderRequest request);
    Task<FolderResponse> RenameAsync(Guid folderId, RenameFolderRequest request);
    Task<FolderResponse> MoveAsync(Guid folderId, MoveFolderRequest request);
    Task DeleteAsync(Guid folderId);
}
