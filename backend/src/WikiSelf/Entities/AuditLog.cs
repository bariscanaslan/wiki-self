using WikiSelf.Entities.Enums;

namespace WikiSelf.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public AuditAction Action { get; set; }
    public ResourceType ResourceType { get; set; }
    public Guid ResourceId { get; set; }
    public Guid? DocumentVersionId { get; set; }
    public DateTime Timestamp { get; set; }
    public string? Details { get; set; }
}
