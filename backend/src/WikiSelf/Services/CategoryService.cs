using Microsoft.EntityFrameworkCore;
using WikiSelf.Data;
using WikiSelf.DTOs.Categories;
using WikiSelf.Entities;
using WikiSelf.Services.Exceptions;

namespace WikiSelf.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;

    public CategoryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<CategoryResponse>> GetAllAsync()
    {
        return await _db.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryResponse(c.Id, c.Name))
            .ToListAsync();
    }

    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest request)
    {
        var exists = await _db.Categories.AnyAsync(c => c.Name == request.Name);
        if (exists)
        {
            throw new ConflictException("A category with this name already exists.");
        }

        var category = new Category { Id = Guid.NewGuid(), Name = request.Name };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return new CategoryResponse(category.Id, category.Name);
    }

    public async Task<CategoryResponse> UpdateAsync(Guid id, UpdateCategoryRequest request)
    {
        var category = await _db.Categories.FindAsync(id) ?? throw new NotFoundException("Category not found.");

        var exists = await _db.Categories.AnyAsync(c => c.Name == request.Name && c.Id != id);
        if (exists)
        {
            throw new ConflictException("A category with this name already exists.");
        }

        category.Name = request.Name;
        await _db.SaveChangesAsync();

        return new CategoryResponse(category.Id, category.Name);
    }

    public async Task DeleteAsync(Guid id)
    {
        var category = await _db.Categories.FindAsync(id) ?? throw new NotFoundException("Category not found.");
        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
    }
}
