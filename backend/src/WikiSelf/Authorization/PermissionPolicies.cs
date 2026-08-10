using WikiSelf.Entities.Enums;

namespace WikiSelf.Authorization;

public static class PermissionPolicies
{
    public const string RequireView = "Permission:View";
    public const string RequireEdit = "Permission:Edit";
    public const string RequireManage = "Permission:Manage";

    public static string ForLevel(PermissionLevel level) => level switch
    {
        PermissionLevel.View => RequireView,
        PermissionLevel.Edit => RequireEdit,
        PermissionLevel.Manage => RequireManage,
        _ => throw new ArgumentOutOfRangeException(nameof(level))
    };
}
