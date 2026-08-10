using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WikiSelf.DTOs.Setup;
using WikiSelf.Services;

namespace WikiSelf.Controllers;

[ApiController]
[Route("api/setup")]
[AllowAnonymous]
public class SetupController : ControllerBase
{
    private readonly ISetupService _setupService;

    public SetupController(ISetupService setupService)
    {
        _setupService = setupService;
    }

    [HttpGet("status")]
    public async Task<ActionResult<SetupStatusResponse>> GetStatus()
    {
        return Ok(await _setupService.GetStatusAsync());
    }

    [HttpPost("initialize")]
    public async Task<ActionResult<SetupInitializeResponse>> Initialize([FromForm] SetupInitializeRequest request)
    {
        return Ok(await _setupService.InitializeAsync(request));
    }
}
