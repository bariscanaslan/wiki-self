using FluentValidation;
using WikiSelf.DTOs.Settings;

namespace WikiSelf.Validators.Settings;

public class UpdateSiteSettingsRequestValidator : AbstractValidator<UpdateSiteSettingsRequest>
{
    public UpdateSiteSettingsRequestValidator()
    {
        RuleFor(x => x.CompanyName).NotEmpty().MaximumLength(256);
        RuleFor(x => x.SiteTitle).NotEmpty().MaximumLength(256);
        RuleFor(x => x.MetaDescription).MaximumLength(512);
        RuleFor(x => x.UiFont).NotEmpty().MaximumLength(128);
        RuleFor(x => x.DocumentFont).NotEmpty().MaximumLength(128);
    }
}
