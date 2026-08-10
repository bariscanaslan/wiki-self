using FluentValidation;
using WikiSelf.DTOs.Groups;

namespace WikiSelf.Validators.Groups;

public class CreateGroupRequestValidator : AbstractValidator<CreateGroupRequest>
{
    public CreateGroupRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(128);
        RuleFor(x => x.Description).MaximumLength(512);
    }
}

public class UpdateGroupRequestValidator : AbstractValidator<UpdateGroupRequest>
{
    public UpdateGroupRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(128);
        RuleFor(x => x.Description).MaximumLength(512);
    }
}

public class UpdateGroupMembersRequestValidator : AbstractValidator<UpdateGroupMembersRequest>
{
    public UpdateGroupMembersRequestValidator()
    {
        RuleFor(x => x.UserIds).NotNull();
    }
}
