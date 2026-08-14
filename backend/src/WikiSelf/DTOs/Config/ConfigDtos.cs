namespace WikiSelf.DTOs.Config;

public record PublicConfigResponse(bool TurnstileEnabled, string TurnstileSiteKey);
