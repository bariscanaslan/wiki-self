using Microsoft.EntityFrameworkCore;
using WikiSelf.Data;
using WikiSelf.DTOs.Tags;
using WikiSelf.Entities;
using WikiSelf.Services.Exceptions;

namespace WikiSelf.Services;

public class TagService : ITagService
{
    private readonly AppDbContext _db;

    public TagService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<TagResponse>> GetAllAsync()
    {
        return await _db.Tags
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .Select(t => new TagResponse(t.Id, t.Name))
            .ToListAsync();
    }

    public async Task<TagResponse> CreateAsync(CreateTagRequest request)
    {
        var exists = await _db.Tags.AnyAsync(t => t.Name == request.Name);
        if (exists)
        {
            throw new ConflictException("A tag with this name already exists.");
        }

        var tag = new Tag { Id = Guid.NewGuid(), Name = request.Name };
        _db.Tags.Add(tag);
        await _db.SaveChangesAsync();

        return new TagResponse(tag.Id, tag.Name);
    }

    public async Task<TagResponse> UpdateAsync(Guid id, UpdateTagRequest request)
    {
        var tag = await _db.Tags.FindAsync(id) ?? throw new NotFoundException("Tag not found.");

        var exists = await _db.Tags.AnyAsync(t => t.Name == request.Name && t.Id != id);
        if (exists)
        {
            throw new ConflictException("A tag with this name already exists.");
        }

        tag.Name = request.Name;
        await _db.SaveChangesAsync();

        return new TagResponse(tag.Id, tag.Name);
    }

    public async Task DeleteAsync(Guid id)
    {
        var tag = await _db.Tags.FindAsync(id) ?? throw new NotFoundException("Tag not found.");
        _db.Tags.Remove(tag);
        await _db.SaveChangesAsync();
    }
}
