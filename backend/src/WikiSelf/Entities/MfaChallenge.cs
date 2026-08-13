namespace WikiSelf.Entities;

public class MfaChallenge
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public int FailedAttempts { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
}
