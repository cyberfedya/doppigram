namespace backend.Models;

public class Story
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = "";
    public User User { get; set; } = null!;
    public string? StorageId { get; set; }
    public string? MediaUrl { get; set; }
    public string? MediaType { get; set; } // image, video
    public string? Text { get; set; }
    public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    public long ExpiresAt { get; set; } = DateTimeOffset.UtcNow.AddHours(24).ToUnixTimeMilliseconds();

    public ICollection<StoryView> Views { get; set; } = [];
}

public class StoryView
{
    public string StoryId { get; set; } = "";
    public Story Story { get; set; } = null!;
    public string ViewerId { get; set; } = "";
    public long ViewedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
}
