using WikiSelf.Entities.Enums;

namespace WikiSelf.Authorization;

public record ResourceKey(ResourceType Type, Guid Id);
