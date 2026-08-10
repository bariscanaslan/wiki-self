using Microsoft.AspNetCore.Authorization;
using WikiSelf.Entities.Enums;

namespace WikiSelf.Authorization;

public class ResourcePermissionRequirement : IAuthorizationRequirement
{
    public ResourcePermissionRequirement(PermissionLevel requiredLevel)
    {
        RequiredLevel = requiredLevel;
    }

    public PermissionLevel RequiredLevel { get; }
}
