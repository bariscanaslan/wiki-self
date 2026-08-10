using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WikiSelf.DTOs.Groups;
using WikiSelf.Services;

namespace WikiSelf.Controllers;

[ApiController]
[Route("api/groups")]
[Authorize(Policy = "RequireAdmin")]
public class GroupsController : ControllerBase
{
    private readonly IGroupService _groupService;

    public GroupsController(IGroupService groupService)
    {
        _groupService = groupService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<GroupResponse>>> GetAll()
    {
        return Ok(await _groupService.GetAllAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GroupDetailResponse>> GetById(Guid id)
    {
        return Ok(await _groupService.GetByIdAsync(id));
    }

    [HttpPost]
    public async Task<ActionResult<GroupResponse>> Create(CreateGroupRequest request)
    {
        var group = await _groupService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = group.Id }, group);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<GroupResponse>> Update(Guid id, UpdateGroupRequest request)
    {
        return Ok(await _groupService.UpdateAsync(id, request));
    }

    [HttpPut("{id:guid}/members")]
    public async Task<ActionResult<GroupDetailResponse>> UpdateMembers(Guid id, UpdateGroupMembersRequest request)
    {
        return Ok(await _groupService.UpdateMembersAsync(id, request));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _groupService.DeleteAsync(id);
        return NoContent();
    }
}
