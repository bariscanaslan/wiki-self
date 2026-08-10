using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WikiSelf.DTOs.Tags;
using WikiSelf.Services;

namespace WikiSelf.Controllers;

[ApiController]
[Route("api/tags")]
[Authorize]
public class TagsController : ControllerBase
{
    private readonly ITagService _tagService;

    public TagsController(ITagService tagService)
    {
        _tagService = tagService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TagResponse>>> GetAll()
    {
        return Ok(await _tagService.GetAllAsync());
    }

    [HttpPost]
    public async Task<ActionResult<TagResponse>> Create(CreateTagRequest request)
    {
        return Ok(await _tagService.CreateAsync(request));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<ActionResult<TagResponse>> Update(Guid id, UpdateTagRequest request)
    {
        return Ok(await _tagService.UpdateAsync(id, request));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "RequireAdmin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _tagService.DeleteAsync(id);
        return NoContent();
    }
}
