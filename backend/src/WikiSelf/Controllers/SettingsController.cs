using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WikiSelf.DTOs.Settings;
using WikiSelf.Services;

namespace WikiSelf.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;

    public SettingsController(ISettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<SiteSettingsResponse>> Get()
    {
        return Ok(await _settingsService.GetAsync());
    }

    [HttpPut]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult<SiteSettingsResponse>> Update(UpdateSiteSettingsRequest request)
    {
        return Ok(await _settingsService.UpdateAsync(request));
    }
}
