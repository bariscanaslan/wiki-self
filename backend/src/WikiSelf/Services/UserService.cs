using Microsoft.EntityFrameworkCore;
using WikiSelf.Data;
using WikiSelf.DTOs.Groups;
using WikiSelf.DTOs.Users;
using WikiSelf.Entities;
using WikiSelf.Services.Exceptions;

namespace WikiSelf.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db)
    {
        _db = db;
    }

    private static UserResponse ToResponse(User user)
    {
        return new UserResponse(
            user.Id,
            user.Email,
            user.DisplayName,
            user.IsAdmin,
            user.IsActive,
            user.CreatedAt,
            user.UserGroups.Select(ug => new GroupSummaryResponse(ug.Group.Id, ug.Group.Name)).ToList());
    }

    public async Task<IReadOnlyList<UserResponse>> GetAllAsync()
    {
        var users = await _db.Users
            .AsNoTracking()
            .Include(u => u.UserGroups).ThenInclude(ug => ug.Group)
            .OrderBy(u => u.DisplayName)
            .ToListAsync();

        return users.Select(ToResponse).ToList();
    }

    public async Task<UserResponse> GetByIdAsync(Guid id)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Include(u => u.UserGroups).ThenInclude(ug => ug.Group)
            .FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new NotFoundException("User not found.");

        return ToResponse(user);
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest request)
    {
        var emailExists = await _db.Users.AnyAsync(u => u.Email == request.Email);
        if (emailExists)
        {
            throw new ConflictException("A user with this email already exists.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName,
            IsAdmin = request.IsAdmin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return ToResponse(user);
    }

    public async Task<UserResponse> UpdateAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _db.Users
            .Include(u => u.UserGroups).ThenInclude(ug => ug.Group)
            .FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new NotFoundException("User not found.");

        user.DisplayName = request.DisplayName;
        user.IsAdmin = request.IsAdmin;

        await _db.SaveChangesAsync();

        return ToResponse(user);
    }

    public async Task SetActiveAsync(Guid id, SetUserActiveRequest request)
    {
        var user = await _db.Users.FindAsync(id) ?? throw new NotFoundException("User not found.");
        user.IsActive = request.IsActive;
        await _db.SaveChangesAsync();
    }

    public async Task<UserResponse> AssignGroupsAsync(Guid id, AssignUserGroupsRequest request)
    {
        var user = await _db.Users
            .Include(u => u.UserGroups).ThenInclude(ug => ug.Group)
            .FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new NotFoundException("User not found.");

        var validGroupIds = await _db.Groups
            .Where(g => request.GroupIds.Contains(g.Id))
            .Select(g => g.Id)
            .ToListAsync();

        user.UserGroups.Clear();
        foreach (var groupId in validGroupIds)
        {
            user.UserGroups.Add(new UserGroup { UserId = user.Id, GroupId = groupId });
        }

        await _db.SaveChangesAsync();

        var reloaded = await _db.Users
            .AsNoTracking()
            .Include(u => u.UserGroups).ThenInclude(ug => ug.Group)
            .FirstAsync(u => u.Id == id);

        return ToResponse(reloaded);
    }

    public async Task ResetPasswordAsync(Guid id, AdminResetPasswordRequest request)
    {
        var user = await _db.Users.FindAsync(id) ?? throw new NotFoundException("User not found.");
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id, Guid actingUserId, DeleteUserRequest request)
    {
        var actingUser = await _db.Users.FindAsync(actingUserId) ?? throw new NotFoundException("User not found.");
        if (!BCrypt.Net.BCrypt.Verify(request.Password, actingUser.PasswordHash))
        {
            throw new UnauthorizedAppException("Invalid password.");
        }

        var user = await _db.Users.FindAsync(id) ?? throw new NotFoundException("User not found.");

        // Folders/documents/versions/assets authored by this user reference it with ON DELETE
        // RESTRICT (by design, so real content never gets silently orphaned), so a hard delete
        // would fail at the database level once the user has created anything. Deactivating
        // (IsActive = false) is the supported way to remove access from such a user.
        var hasContentActivity = await _db.Folders.AnyAsync(f => f.CreatedByUserId == id)
            || await _db.Documents.AnyAsync(d => d.CreatedByUserId == id)
            || await _db.DocumentVersions.AnyAsync(v => v.AuthorUserId == id)
            || await _db.Assets.AnyAsync(a => a.UploadedByUserId == id);

        if (hasContentActivity)
        {
            throw new ConflictException("This user has created folders, documents, or files and cannot be deleted. Deactivate the account instead.");
        }

        // Unlike the content tables above, audit log entries are purely historical records, not
        // referenced content — deleting the user is expected to take their audit trail with it.
        await _db.AuditLogs.Where(a => a.UserId == id).ExecuteDeleteAsync();

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
    }
}
