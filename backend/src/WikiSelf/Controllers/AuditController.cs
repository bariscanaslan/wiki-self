using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WikiSelf.DTOs.Audit;
using WikiSelf.DTOs.Common;
using WikiSelf.Services;

namespace WikiSelf.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize(Policy = "RequireAdmin")]
public class AuditController : ControllerBase
{
    private readonly IAuditService _auditService;

    public AuditController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AuditLogResponse>>> GetLogs([FromQuery] AuditLogFilterRequest filter)
    {
        return Ok(await _auditService.GetLogsAsync(filter));
    }
}
