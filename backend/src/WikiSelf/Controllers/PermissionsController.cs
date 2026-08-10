using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WikiSelf.DTOs.Permissions;
using WikiSelf.Entities.Enums;
using WikiSelf.Services;

namespace WikiSelf.Controllers;

[ApiController]
[Route("api/permissions")]
[Authorize(Policy = "RequireAdmin")]
public class PermissionsController : ControllerBase
{
    private readonly IPermissionService _permissionService;

    public PermissionsController(IPermissionService permissionService)
    {
        _permissionService = permissionService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PermissionResponse>>> GetForResource(
        [FromQuery] ResourceType resourceType, [FromQuery] Guid resourceId)
    {
        return Ok(await _permissionService.GetPermissionsForResourceAsync(resourceType, resourceId));
    }

    [HttpPost]
    public async Task<ActionResult<PermissionResponse>> Assign(AssignPermissionRequest request)
    {
        return Ok(await _permissionService.AssignPermissionAsync(request));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Remove(Guid id)
    {
        await _permissionService.RemovePermissionAsync(id);
        return NoContent();
    }
}
