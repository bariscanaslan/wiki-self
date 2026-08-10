using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WikiSelf.Data;
using WikiSelf.DTOs.Audit;
using WikiSelf.DTOs.Common;
using WikiSelf.Entities;
using WikiSelf.Entities.Enums;

namespace WikiSelf.Services;

public class AuditService : IAuditService
{
    private readonly AppDbContext _db;

    public AuditService(AppDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(Guid userId, AuditAction action, ResourceType resourceType, Guid resourceId, Guid? documentVersionId = null, object? details = null)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Action = action,
            ResourceType = resourceType,
            ResourceId = resourceId,
            DocumentVersionId = documentVersionId,
            Timestamp = DateTime.UtcNow,
            Details = details is null ? null : JsonSerializer.Serialize(details)
        });

        await _db.SaveChangesAsync();
    }

    public async Task<PagedResult<AuditLogResponse>> GetLogsAsync(AuditLogFilterRequest filter)
    {
        var query = _db.AuditLogs.AsNoTracking().Include(a => a.User).AsQueryable();

        if (filter.UserId.HasValue)
        {
            query = query.Where(a => a.UserId == filter.UserId.Value);
        }

        if (filter.ResourceType.HasValue)
        {
            query = query.Where(a => a.ResourceType == filter.ResourceType.Value);
        }

        if (filter.ResourceId.HasValue)
        {
            query = query.Where(a => a.ResourceId == filter.ResourceId.Value);
        }

        if (filter.Action.HasValue)
        {
            query = query.Where(a => a.Action == filter.Action.Value);
        }

        if (filter.From.HasValue)
        {
            query = query.Where(a => a.Timestamp >= filter.From.Value);
        }

        if (filter.To.HasValue)
        {
            query = query.Where(a => a.Timestamp <= filter.To.Value);
        }

        var totalCount = await query.CountAsync();

        var page = Math.Max(filter.Page, 1);
        var pageSize = Math.Clamp(filter.PageSize, 1, 200);

        var items = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogResponse(
                a.Id,
                a.UserId,
                a.User.DisplayName,
                a.Action,
                a.ResourceType,
                a.ResourceId,
                a.DocumentVersionId,
                a.Timestamp,
                a.Details))
            .ToListAsync();

        return new PagedResult<AuditLogResponse>(items, totalCount, page, pageSize);
    }
}
