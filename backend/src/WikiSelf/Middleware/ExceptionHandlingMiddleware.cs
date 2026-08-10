using System.Net;
using System.Text.Json;
using WikiSelf.DTOs.Common;
using WikiSelf.Services.Exceptions;

namespace WikiSelf.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            context.Response.StatusCode = (int)MapStatusCode(ex);
            context.Response.ContentType = "application/json";

            var response = new ErrorResponse(ex.Error, ex.Message, ex.Details);
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        catch (FluentValidation.ValidationException ex)
        {
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/json";

            var details = ex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            var response = new ErrorResponse("validation_error", "One or more validation errors occurred.", details);
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred while processing {Method} {Path}", context.Request.Method, context.Request.Path);

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            var response = new ErrorResponse("internal_error", "An unexpected error occurred.", null);
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }

    private static HttpStatusCode MapStatusCode(AppException exception) => exception switch
    {
        NotFoundException => HttpStatusCode.NotFound,
        ForbiddenException => HttpStatusCode.Forbidden,
        ConflictException => HttpStatusCode.Conflict,
        BadRequestException => HttpStatusCode.BadRequest,
        UnauthorizedAppException => HttpStatusCode.Unauthorized,
        _ => HttpStatusCode.InternalServerError
    };
}
