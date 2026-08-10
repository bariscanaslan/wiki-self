namespace WikiSelf.Entities;

public class DocumentVersion
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;
    public string ContentJson { get; set; } = string.Empty;
    public string ContentMarkdown { get; set; } = string.Empty;
    public Guid AuthorUserId { get; set; }
    public User AuthorUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public int VersionNumber { get; set; }
}
