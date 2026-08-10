using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WikiSelf.DTOs.Search;
using WikiSelf.Services;

namespace WikiSelf.Controllers;

[ApiController]
[Route("api/search")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;
    private readonly ICurrentUserService _currentUser;

    public SearchController(ISearchService searchService, ICurrentUserService currentUser)
    {
        _searchService = searchService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<SearchResponse>> Search([FromQuery] string q, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return Ok(await _searchService.SearchAsync(_currentUser.UserId, q, page, pageSize));
    }
}
