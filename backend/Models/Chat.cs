namespace backend.Models;

public class Chat
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public bool IsGroup { get; set; } = false;
    public string? CreatedBy { get; set; }
    public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    public ICollection<ChatParticipant> Participants { get; set; } = [];
    public ICollection<Message> Messages { get; set; } = [];
}

public class ChatParticipant
{
    public string ChatId { get; set; } = "";
    public Chat Chat { get; set; } = null!;
    public string UserId { get; set; } = "";
    public User User { get; set; } = null!;
}
