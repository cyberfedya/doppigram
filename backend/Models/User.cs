namespace backend.Models;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Username { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string? Avatar { get; set; }
    public string? AvatarType { get; set; }
    public bool IsAdmin { get; set; } = false;
    public bool IsVerified { get; set; } = false;
    public bool IsBanned { get; set; } = false;
    public string? BanReason { get; set; }
    public bool IsOnline { get; set; } = false;
    public long LastSeen { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    public string? StatusText { get; set; }
    public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    public ICollection<ChatParticipant> ChatParticipants { get; set; } = [];
    public ICollection<Message> Messages { get; set; } = [];
    public ICollection<Story> Stories { get; set; } = [];
    public ICollection<MessageReaction> Reactions { get; set; } = [];
}
