using WikiSelf.Entities.Enums;

namespace WikiSelf.DTOs.Audit;

public record AuditLogResponse(
    Guid Id,
    Guid UserId,
    string UserDisplayName,
    AuditAction Action,
    ResourceType ResourceType,
    Guid ResourceId,
    Guid? DocumentVersionId,
    DateTime Timestamp,
    string? Details);

public record AuditLogFilterRequest(
    Guid? UserId,
    ResourceType? ResourceType,
    Guid? ResourceId,
    AuditAction? Action,
    DateTime? From,
    DateTime? To,
    int Page = 1,
    int PageSize = 50);

public record LogExportRequest(string? Format);
