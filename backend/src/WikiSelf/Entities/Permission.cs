using WikiSelf.Entities.Enums;

namespace WikiSelf.Entities;

public class Permission
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Group Group { get; set; } = null!;
    public ResourceType ResourceType { get; set; }
    public Guid ResourceId { get; set; }
    public PermissionLevel Level { get; set; }
}
