namespace WikiSelf.DTOs.Categories;

public record CategoryResponse(Guid Id, string Name);

public record CreateCategoryRequest(string Name);

public record UpdateCategoryRequest(string Name);
