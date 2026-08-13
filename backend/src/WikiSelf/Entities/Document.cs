using NpgsqlTypes;

namespace WikiSelf.Entities;

public class Document
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid FolderId { get; set; }
    public Folder Folder { get; set; } = null!;
    public Guid? CurrentVersionId { get; set; }
    public DocumentVersion? CurrentVersion { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public DateTime UpdatedAt { get; set; }
    public string SearchContent { get; set; } = string.Empty;
    public NpgsqlTsVector SearchVector { get; set; } = null!;

    public ICollection<DocumentVersion> Versions { get; set; } = new List<DocumentVersion>();
    public ICollection<DocumentTag> DocumentTags { get; set; } = new List<DocumentTag>();
    public ICollection<Asset> Assets { get; set; } = new List<Asset>();
}
