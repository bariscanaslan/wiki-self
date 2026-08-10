using FluentValidation;
using WikiSelf.DTOs.Folders;

namespace WikiSelf.Validators.Folders;

public class CreateFolderRequestValidator : AbstractValidator<CreateFolderRequest>
{
    public CreateFolderRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(256);
    }
}

public class RenameFolderRequestValidator : AbstractValidator<RenameFolderRequest>
{
    public RenameFolderRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(256);
    }
}
