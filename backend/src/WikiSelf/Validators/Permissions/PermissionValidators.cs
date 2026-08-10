using FluentValidation;
using WikiSelf.DTOs.Permissions;

namespace WikiSelf.Validators.Permissions;

public class AssignPermissionRequestValidator : AbstractValidator<AssignPermissionRequest>
{
    public AssignPermissionRequestValidator()
    {
        RuleFor(x => x.GroupId).NotEmpty();
        RuleFor(x => x.ResourceId).NotEmpty();
        RuleFor(x => x.ResourceType).IsInEnum();
        RuleFor(x => x.Level).IsInEnum();
    }
}
