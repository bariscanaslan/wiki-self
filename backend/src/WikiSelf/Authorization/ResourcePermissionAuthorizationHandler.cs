using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using WikiSelf.Entities.Enums;
using WikiSelf.Services;

namespace WikiSelf.Authorization;

public class ResourcePermissionAuthorizationHandler : AuthorizationHandler<ResourcePermissionRequirement, ResourceKey>
{
    private readonly IPermissionService _permissionService;

    public ResourcePermissionAuthorizationHandler(IPermissionService permissionService)
    {
        _permissionService = permissionService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context, ResourcePermissionRequirement requirement, ResourceKey resource)
    {
        var userIdValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdValue is null || !Guid.TryParse(userIdValue, out var userId))
        {
            return;
        }

        var hasPermission = resource.Type == ResourceType.Folder
            ? await _permissionService.HasFolderPermissionAsync(userId, resource.Id, requirement.RequiredLevel)
            : await _permissionService.HasDocumentPermissionAsync(userId, resource.Id, requirement.RequiredLevel);

        if (hasPermission)
        {
            context.Succeed(requirement);
        }
    }
}
