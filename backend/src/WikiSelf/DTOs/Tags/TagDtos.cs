namespace WikiSelf.DTOs.Tags;

public record TagResponse(Guid Id, string Name);

public record CreateTagRequest(string Name);

public record UpdateTagRequest(string Name);
