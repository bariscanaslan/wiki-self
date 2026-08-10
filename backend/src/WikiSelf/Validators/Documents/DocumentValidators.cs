using FluentValidation;
using WikiSelf.DTOs.Documents;

namespace WikiSelf.Validators.Documents;

public class CreateDocumentRequestValidator : AbstractValidator<CreateDocumentRequest>
{
    public CreateDocumentRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(512);
        RuleFor(x => x.FolderId).NotEmpty();
        RuleFor(x => x.ContentJson).NotEmpty();
        RuleFor(x => x.ContentMarkdown).NotNull();
    }
}

public class SaveDocumentRequestValidator : AbstractValidator<SaveDocumentRequest>
{
    public SaveDocumentRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(512);
        RuleFor(x => x.ContentJson).NotEmpty();
        RuleFor(x => x.ContentMarkdown).NotNull();
    }
}

public class MoveDocumentRequestValidator : AbstractValidator<MoveDocumentRequest>
{
    public MoveDocumentRequestValidator()
    {
        RuleFor(x => x.FolderId).NotEmpty();
    }
}

public class AssignDocumentTagsRequestValidator : AbstractValidator<AssignDocumentTagsRequest>
{
    public AssignDocumentTagsRequestValidator()
    {
        RuleFor(x => x.TagIds).NotNull();
    }
}
