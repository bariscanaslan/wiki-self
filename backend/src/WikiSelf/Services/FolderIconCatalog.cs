namespace WikiSelf.Services;

public static class FolderIconCatalog
{
    // Keys mirror frontend/lib/icons/folderIcons.ts — keep both lists in sync.
    public static readonly IReadOnlySet<string> AllowedIcons = new HashSet<string>
    {
        "folder", "folder-open", "briefcase", "box-archive", "book", "building",
        "code", "database", "flask", "gear", "graduation-cap", "hard-drive",
        "image", "layer-group", "lock", "map", "palette", "people-group",
        "rocket", "server", "shield-halved", "star", "tag", "wrench",
    };
}
