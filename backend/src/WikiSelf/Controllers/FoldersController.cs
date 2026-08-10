using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WikiSelf.Authorization;
using WikiSelf.DTOs.Folders;
using WikiSelf.Entities.Enums;
using WikiSelf.Services;
using WikiSelf.Services.Exceptions;
using IAuthorizationService = Microsoft.AspNetCore.Authorization.IAuthorizationService;

namespace WikiSelf.Controllers;

[ApiController]
[Route("api/folders")]
[Authorize]
public class FoldersController : ControllerBase
{
    private readonly IFolderService _folderService;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuthorizationService _authorizationService;

    public FoldersController(IFolderService folderService, ICurrentUserService currentUser, IAuthorizationService authorizationService)
    {
        _folderService = folderService;
        _currentUser = currentUser;
        _authorizationService = authorizationService;
    }

    private async Task EnsureFolderPermissionAsync(Guid folderId, string policy)
    {
        var result = await _authorizationService.AuthorizeAsync(User, new ResourceKey(ResourceType.Folder, folderId), policy);
        if (!result.Succeeded)
        {
            throw new ForbiddenException();
        }
    }

    [HttpGet("tree")]
    public async Task<ActionResult<IReadOnlyList<FolderTreeNodeResponse>>> GetTree()
    {
        return Ok(await _folderService.GetTreeAsync(_currentUser.UserId));
    }

    [HttpPost]
    public async Task<ActionResult<FolderResponse>> Create(CreateFolderRequest request)
    {
        if (request.ParentId.HasValue)
        {
            await EnsureFolderPermissionAsync(request.ParentId.Value, PermissionPolicies.RequireManage);
        }
        else if (!_currentUser.IsAdmin)
        {
            throw new ForbiddenException("Only administrators can create root-level folders.");
        }

        var folder = await _folderService.CreateAsync(_currentUser.UserId, request);
        return CreatedAtAction(nameof(GetTree), folder);
    }

    [HttpPut("{id:guid}/rename")]
    public async Task<ActionResult<FolderResponse>> Rename(Guid id, RenameFolderRequest request)
    {
        await EnsureFolderPermissionAsync(id, PermissionPolicies.RequireManage);
        return Ok(await _folderService.RenameAsync(id, request));
    }

    [HttpPut("{id:guid}/move")]
    public async Task<ActionResult<FolderResponse>> Move(Guid id, MoveFolderRequest request)
    {
        await EnsureFolderPermissionAsync(id, PermissionPolicies.RequireManage);

        if (request.NewParentId.HasValue)
        {
            await EnsureFolderPermissionAsync(request.NewParentId.Value, PermissionPolicies.RequireManage);
        }
        else if (!_currentUser.IsAdmin)
        {
            throw new ForbiddenException("Only administrators can move folders to the root.");
        }

        return Ok(await _folderService.MoveAsync(id, request));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await EnsureFolderPermissionAsync(id, PermissionPolicies.RequireManage);
        await _folderService.DeleteAsync(id);
        return NoContent();
    }
}
