namespace WikiSelf.Entities;

public class Tag
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<DocumentTag> DocumentTags { get; set; } = new List<DocumentTag>();
}
