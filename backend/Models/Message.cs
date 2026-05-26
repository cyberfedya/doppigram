namespace backend.Models;

public class Message
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ChatId { get; set; } = "";
    public Chat Chat { get; set; } = null!;
    public string SenderId { get; set; } = "";
    public User Sender { get; set; } = null!;
    public string Text { get; set; } = "";
    public string MessageType { get; set; } = "text"; // text, image, video, sticker, video_message, voice
    public string? StorageId { get; set; }
    public string? FileUrl { get; set; }
    public string? ReplyToId { get; set; }
    public Message? ReplyTo { get; set; }
    public bool IsPinned { get; set; } = false;
    public bool IsRead { get; set; } = false;
    public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    public ICollection<MessageReaction> Reactions { get; set; } = [];
    public ICollection<Message> Replies { get; set; } = [];
}

public class MessageReaction
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string MessageId { get; set; } = "";
    public Message Message { get; set; } = null!;
    public string UserId { get; set; } = "";
    public User User { get; set; } = null!;
    public string Reaction { get; set; } = "";
}
