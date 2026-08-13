using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WikiSelf.Authorization;
using WikiSelf.DTOs.Audit;
using WikiSelf.DTOs.Documents;
using WikiSelf.Entities.Enums;
using WikiSelf.Services;
using WikiSelf.Services.Exceptions;
using IAuthorizationService = Microsoft.AspNetCore.Authorization.IAuthorizationService;

namespace WikiSelf.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuthorizationService _authorizationService;

    public DocumentsController(IDocumentService documentService, ICurrentUserService currentUser, IAuthorizationService authorizationService)
    {
        _documentService = documentService;
        _currentUser = currentUser;
        _authorizationService = authorizationService;
    }

    private async Task EnsureDocumentPermissionAsync(Guid documentId, string policy)
    {
        var result = await _authorizationService.AuthorizeAsync(User, new ResourceKey(ResourceType.Document, documentId), policy);
        if (!result.Succeeded)
        {
            throw new ForbiddenException();
        }
    }

    private async Task EnsureFolderPermissionAsync(Guid folderId, string policy)
    {
        var result = await _authorizationService.AuthorizeAsync(User, new ResourceKey(ResourceType.Folder, folderId), policy);
        if (!result.Succeeded)
        {
            throw new ForbiddenException();
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DocumentResponse>> GetById(Guid id)
    {
        await EnsureDocumentPermissionAsync(id, PermissionPolicies.RequireView);
        return Ok(await _documentService.GetByIdAsync(id, _currentUser.UserId));
    }

    [HttpPost]
    public async Task<ActionResult<DocumentResponse>> Create(CreateDocumentRequest request)
    {
        await EnsureFolderPermissionAsync(request.FolderId, PermissionPolicies.RequireEdit);
        var document = await _documentService.CreateAsync(_currentUser.UserId, request);
        return CreatedAtAction(nameof(GetById), new { id = document.Id }, document);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DocumentResponse>> Save(Guid id, SaveDocumentRequest request)
    {
        await EnsureDocumentPermissionAsync(id, PermissionPolicies.RequireEdit);
        return Ok(await _documentService.SaveNewVersionAsync(id, _currentUser.UserId, request));
    }

    [HttpGet("{id:guid}/versions")]
    public async Task<ActionResult<IReadOnlyList<DocumentVersionResponse>>> GetVersionHistory(Guid id)
    {
        await EnsureDocumentPermissionAsync(id, PermissionPolicies.RequireView);
        return Ok(await _documentService.GetVersionHistoryAsync(id));
    }

    [HttpGet("{id:guid}/versions/{versionId:guid}")]
    public async Task<ActionResult<DocumentVersionDetailResponse>> GetVersion(Guid id, Guid versionId)
    {
        await EnsureDocumentPermissionAsync(id, PermissionPolicies.RequireView);
        return Ok(await _documentService.GetVersionAsync(id, versionId));
    }

    [HttpPost("{id:guid}/versions/{versionId:guid}/restore")]
    public async Task<ActionResult<DocumentResponse>> RestoreVersion(Guid id, Guid versionId)
    {
        await EnsureDocumentPermissionAsync(id, PermissionPolicies.RequireEdit);
        return Ok(await _documentService.RestoreVersionAsync(id, versionId, _currentUser.UserId));
    }

    [HttpPut("{id:guid}/tags")]
    public async Task<ActionResult<DocumentResponse>> AssignTags(Guid id, AssignDocumentTagsRequest request)
    {
        await EnsureDocumentPermissionAsync(id, PermissionPolicies.RequireEdit);
        return Ok(await _documentService.AssignTagsAsync(id, _currentUser.UserId, request));
    }

    [HttpPut("{id:guid}/move")]
    public async Task<ActionResult<DocumentResponse>> Move(Guid id, MoveDocumentRequest request)
    {
        await EnsureDocumentPermissionAsync(id, PermissionPolicies.RequireEdit);
        await EnsureFolderPermissionAsync(request.FolderId, PermissionPolicies.RequireEdit);
        return Ok(await _documentService.MoveAsync(id, _currentUser.UserId, request));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await EnsureDocumentPermissionAsync(id, PermissionPolicies.RequireManage);
        await _documentService.DeleteAsync(id, _currentUser.UserId);
        return NoContent();
    }

    [HttpGet("{id:guid}/export-content")]
    public async Task<ActionResult<ExportContentResponse>> GetExportContent(Guid id)
    {
        await EnsureDocumentPermissionAsync(id, PermissionPolicies.RequireView);
        return Ok(await _documentService.GetExportContentAsync(id));
    }

    [HttpPost("{id:guid}/log-export")]
    public async Task<IActionResult> LogExport(Guid id, LogExportRequest request)
    {
        await EnsureDocumentPermissionAsync(id, PermissionPolicies.RequireView);
        await _documentService.LogExportAsync(id, _currentUser.UserId, request);
        return NoContent();
    }
}
