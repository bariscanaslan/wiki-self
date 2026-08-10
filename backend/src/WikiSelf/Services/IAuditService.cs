using WikiSelf.DTOs.Audit;
using WikiSelf.DTOs.Common;
using WikiSelf.Entities.Enums;

namespace WikiSelf.Services;

public interface IAuditService
{
    Task LogAsync(Guid userId, AuditAction action, ResourceType resourceType, Guid resourceId, Guid? documentVersionId = null, object? details = null);
    Task<PagedResult<AuditLogResponse>> GetLogsAsync(AuditLogFilterRequest filter);
}
