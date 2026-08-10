using FluentValidation;
using WikiSelf.DTOs.Setup;

namespace WikiSelf.Validators.Setup;

public class SetupInitializeRequestValidator : AbstractValidator<SetupInitializeRequest>
{
    public SetupInitializeRequestValidator()
    {
        RuleFor(x => x.AdminEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.AdminPassword).NotEmpty().MinimumLength(8);
        RuleFor(x => x.AdminDisplayName).NotEmpty().MaximumLength(128);
        RuleFor(x => x.CompanyName).NotEmpty().MaximumLength(256);
        RuleFor(x => x.SiteTitle).NotEmpty().MaximumLength(256);
        RuleFor(x => x.MetaDescription).MaximumLength(512);
    }
}
