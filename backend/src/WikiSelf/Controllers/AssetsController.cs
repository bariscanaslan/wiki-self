using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WikiSelf.Authorization;
using WikiSelf.DTOs.Assets;
using WikiSelf.Entities.Enums;
using WikiSelf.Services;
using WikiSelf.Services.Exceptions;
using IAuthorizationService = Microsoft.AspNetCore.Authorization.IAuthorizationService;

namespace WikiSelf.Controllers;

[ApiController]
[Route("api/assets")]
[Authorize]
public class AssetsController : ControllerBase
{
    private readonly IAssetService _assetService;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuthorizationService _authorizationService;

    public AssetsController(IAssetService assetService, ICurrentUserService currentUser, IAuthorizationService authorizationService)
    {
        _assetService = assetService;
        _currentUser = currentUser;
        _authorizationService = authorizationService;
    }

    [HttpPost("upload")]
    public async Task<ActionResult<AssetResponse>> Upload([FromForm] UploadAssetRequest request)
    {
        if (request.DocumentId.HasValue)
        {
            var result = await _authorizationService.AuthorizeAsync(
                User, new ResourceKey(ResourceType.Document, request.DocumentId.Value), PermissionPolicies.RequireEdit);

            if (!result.Succeeded)
            {
                throw new ForbiddenException();
            }
        }

        return Ok(await _assetService.UploadAsync(_currentUser.UserId, request.File, request.DocumentId));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AssetResponse>> GetMetadata(Guid id)
    {
        return Ok(await _assetService.GetMetadataAsync(id));
    }

    [HttpGet("{id:guid}/file")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFile(Guid id)
    {
        var (stream, contentType, fileName) = await _assetService.GetFileAsync(id);
        return File(stream, contentType, fileName);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _assetService.DeleteAsync(id);
        return NoContent();
    }
}
