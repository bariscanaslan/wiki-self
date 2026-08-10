using Microsoft.EntityFrameworkCore;
using WikiSelf.Data;
using WikiSelf.DTOs.Groups;
using WikiSelf.DTOs.Users;
using WikiSelf.Entities;
using WikiSelf.Services.Exceptions;

namespace WikiSelf.Services;

public class GroupService : IGroupService
{
    private readonly AppDbContext _db;

    public GroupService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<GroupResponse>> GetAllAsync()
    {
        return await _db.Groups
            .AsNoTracking()
            .OrderBy(g => g.Name)
            .Select(g => new GroupResponse(g.Id, g.Name, g.Description, g.UserGroups.Count))
            .ToListAsync();
    }

    public async Task<GroupDetailResponse> GetByIdAsync(Guid id)
    {
        var group = await _db.Groups
            .AsNoTracking()
            .Include(g => g.UserGroups).ThenInclude(ug => ug.User)
            .FirstOrDefaultAsync(g => g.Id == id)
            ?? throw new NotFoundException("Group not found.");

        return ToDetailResponse(group);
    }

    private static GroupDetailResponse ToDetailResponse(Group group)
    {
        return new GroupDetailResponse(
            group.Id,
            group.Name,
            group.Description,
            group.UserGroups.Select(ug => new UserSummaryResponse(ug.User.Id, ug.User.Email, ug.User.DisplayName)).ToList());
    }

    public async Task<GroupResponse> CreateAsync(CreateGroupRequest request)
    {
        var nameExists = await _db.Groups.AnyAsync(g => g.Name == request.Name);
        if (nameExists)
        {
            throw new ConflictException("A group with this name already exists.");
        }

        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description
        };

        _db.Groups.Add(group);
        await _db.SaveChangesAsync();

        return new GroupResponse(group.Id, group.Name, group.Description, 0);
    }

    public async Task<GroupResponse> UpdateAsync(Guid id, UpdateGroupRequest request)
    {
        var group = await _db.Groups.FindAsync(id) ?? throw new NotFoundException("Group not found.");

        group.Name = request.Name;
        group.Description = request.Description;

        await _db.SaveChangesAsync();

        var memberCount = await _db.UserGroups.CountAsync(ug => ug.GroupId == id);
        return new GroupResponse(group.Id, group.Name, group.Description, memberCount);
    }

    public async Task DeleteAsync(Guid id)
    {
        var group = await _db.Groups.FindAsync(id) ?? throw new NotFoundException("Group not found.");
        _db.Groups.Remove(group);
        await _db.SaveChangesAsync();
    }

    public async Task<GroupDetailResponse> UpdateMembersAsync(Guid id, UpdateGroupMembersRequest request)
    {
        var group = await _db.Groups
            .Include(g => g.UserGroups).ThenInclude(ug => ug.User)
            .FirstOrDefaultAsync(g => g.Id == id)
            ?? throw new NotFoundException("Group not found.");

        var validUserIds = await _db.Users
            .Where(u => request.UserIds.Contains(u.Id))
            .Select(u => u.Id)
            .ToListAsync();

        group.UserGroups.Clear();
        foreach (var userId in validUserIds)
        {
            group.UserGroups.Add(new UserGroup { UserId = userId, GroupId = group.Id });
        }

        await _db.SaveChangesAsync();

        var reloaded = await _db.Groups
            .AsNoTracking()
            .Include(g => g.UserGroups).ThenInclude(ug => ug.User)
            .FirstAsync(g => g.Id == id);

        return ToDetailResponse(reloaded);
    }
}
