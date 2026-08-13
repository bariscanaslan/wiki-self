namespace WikiSelf.Entities;

public class Folder
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
    public Folder? Parent { get; set; }
    public string MaterializedPath { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public ICollection<Folder> Children { get; set; } = new List<Folder>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
}
