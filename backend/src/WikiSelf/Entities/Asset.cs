namespace WikiSelf.Entities;

public class Asset
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public Guid UploadedByUserId { get; set; }
    public User UploadedByUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public Guid? DocumentId { get; set; }
    public Document? Document { get; set; }
}
