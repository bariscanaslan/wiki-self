using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using WikiSelf.DTOs.Config;
using WikiSelf.Services.Auth;

namespace WikiSelf.Controllers;

[ApiController]
[Route("api/config")]
public class ConfigController : ControllerBase
{
    private readonly TurnstileSettings _turnstileSettings;

    public ConfigController(IOptions<TurnstileSettings> turnstileSettings)
    {
        _turnstileSettings = turnstileSettings.Value;
    }

    [HttpGet]
    [AllowAnonymous]
    public ActionResult<PublicConfigResponse> Get()
    {
        return Ok(new PublicConfigResponse(_turnstileSettings.Enabled, _turnstileSettings.SiteKey));
    }
}
