using WikiSelf.DTOs.Setup;

namespace WikiSelf.Services;

public interface ISetupService
{
    Task<SetupStatusResponse> GetStatusAsync();
    Task<SetupInitializeResponse> InitializeAsync(SetupInitializeRequest request);
}
