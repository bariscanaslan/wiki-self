using FluentValidation;
using WikiSelf.DTOs.Auth;

namespace WikiSelf.Validators.Auth;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public class LogoutRequestValidator : AbstractValidator<LogoutRequest>
{
    public LogoutRequestValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public class VerifyPasswordRequestValidator : AbstractValidator<VerifyPasswordRequest>
{
    public VerifyPasswordRequestValidator()
    {
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class TwoFactorVerifyRequestValidator : AbstractValidator<TwoFactorVerifyRequest>
{
    public TwoFactorVerifyRequestValidator()
    {
        RuleFor(x => x.ChallengeToken).NotEmpty();
        RuleFor(x => x.Code).NotEmpty();
    }
}

public class TwoFactorEnableRequestValidator : AbstractValidator<TwoFactorEnableRequest>
{
    public TwoFactorEnableRequestValidator()
    {
        RuleFor(x => x.Code).NotEmpty();
    }
}

public class TwoFactorDisableRequestValidator : AbstractValidator<TwoFactorDisableRequest>
{
    public TwoFactorDisableRequestValidator()
    {
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8);
    }
}
