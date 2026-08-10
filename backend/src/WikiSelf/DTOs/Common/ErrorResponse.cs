namespace WikiSelf.DTOs.Common;

public record ErrorResponse(string Error, string Message, object? Details);
