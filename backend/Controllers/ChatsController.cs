using backend.Data;
using backend.DTOs;
using backend.Hubs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/chats")]
public class ChatsController(AppDbContext db, IHubContext<ChatHub> hub) : ControllerBase
{
    // GET /api/chats?userId=xxx
    [HttpGet]
    public async Task<IActionResult> GetChats([FromQuery] string userId)
    {
        var chats = await db.ChatParticipants
            .Where(cp => cp.UserId == userId)
            .Include(cp => cp.Chat).ThenInclude(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
            .Include(cp => cp.Chat).ThenInclude(c => c.Participants).ThenInclude(p => p.User)
            .Select(cp => cp.Chat)
            .ToListAsync();

        var result = chats.Select(chat =>
        {
            var lastMsg = chat.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault();
            var unread = chat.Messages.Count(m => !m.IsRead && m.SenderId != userId);

            // For DM: use other user's name and verified status
            string name = chat.Name;
            bool isVerified = false;
            if (!chat.IsGroup)
            {
                var other = chat.Participants.FirstOrDefault(p => p.UserId != userId)?.User;
                if (other != null)
                {
                    name = other.DisplayName.Length > 0 ? other.DisplayName : other.Username;
                    isVerified = other.IsVerified;
                }
            }

            return new ChatDto(
                chat.Id, name, chat.IsGroup, isVerified, chat.CreatedAt,
                lastMsg?.Text, lastMsg?.MessageType,
                lastMsg?.CreatedAt, unread);
        }).OrderByDescending(c => c.LastMessageTime ?? c.CreatedAt).ToList();

        return Ok(result);
    }

    // GET /api/chats/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetChat(string id)
    {
        var chat = await db.Chats.FindAsync(id);
        if (chat == null) return NotFound();
        return Ok(new ChatInfoDto(chat.Id, chat.Name, chat.IsGroup));
    }

    // POST /api/chats
    [HttpPost]
    public async Task<IActionResult> CreateChat([FromBody] CreateChatRequest req)
    {
        // For DM: check if already exists
        if (!req.IsGroup && req.ParticipantIds.Count == 1)
        {
            var otherId = req.ParticipantIds[0];
            var existing = await db.ChatParticipants
                .Where(cp => cp.UserId == req.CreatedBy)
                .Select(cp => cp.ChatId)
                .Intersect(db.ChatParticipants
                    .Where(cp => cp.UserId == otherId)
                    .Select(cp => cp.ChatId))
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                var existingChat = await db.Chats.FindAsync(existing);
                if (existingChat != null && !existingChat.IsGroup)
                    return Ok(new { id = existing });
            }
        }

        var chat = new Chat
        {
            Id = Guid.NewGuid().ToString(),
            Name = req.Name,
            IsGroup = req.IsGroup,
            CreatedBy = req.CreatedBy,
        };

        db.Chats.Add(chat);

        // Add creator
        db.ChatParticipants.Add(new ChatParticipant { ChatId = chat.Id, UserId = req.CreatedBy });

        // Add participants
        foreach (var pid in req.ParticipantIds.Where(p => p != req.CreatedBy))
            db.ChatParticipants.Add(new ChatParticipant { ChatId = chat.Id, UserId = pid });

        await db.SaveChangesAsync();
        return Ok(new { id = chat.Id });
    }

    // GET /api/chats/{id}/participants-status?currentUserId=xxx
    [HttpGet("{id}/participants-status")]
    public async Task<IActionResult> GetParticipantsStatus(string id, [FromQuery] string currentUserId)
    {
        var participants = await db.ChatParticipants
            .Where(cp => cp.ChatId == id && cp.UserId != currentUserId)
            .Include(cp => cp.User)
            .ToListAsync();

        var result = participants.Select(cp => new ParticipantStatusDto(
            cp.User.Id, cp.User.Username, cp.User.DisplayName,
            cp.User.IsOnline, cp.User.LastSeen, cp.User.IsVerified));

        return Ok(result);
    }

    // GET /api/chats/{id}/messages?limit=100
    [HttpGet("{id}/messages")]
    public async Task<IActionResult> GetMessages(string id, [FromQuery] int limit = 100)
    {
        var messages = await db.Messages
            .Where(m => m.ChatId == id)
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit)
            .Include(m => m.ReplyTo).ThenInclude(r => r!.Sender)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        return Ok(messages.Select(ToMessageDto));
    }

    // POST /api/chats/{id}/messages
    [HttpPost("{id}/messages")]
    public async Task<IActionResult> SendMessage(string id, [FromBody] SendMessageRequest req)
    {
        var msg = new Message
        {
            Id = Guid.NewGuid().ToString(),
            ChatId = id,
            SenderId = req.SenderId,
            Text = req.Text,
            MessageType = req.MessageType,
            StorageId = req.StorageId,
            ReplyToId = req.ReplyToId,
            CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        // Resolve file URL from storageId
        if (req.StorageId != null)
        {
            var reqHttp = HttpContext.Request;
            var baseUrl = $"{reqHttp.Scheme}://{reqHttp.Host}";
            var files = Directory.GetFiles(
                Path.Combine(Directory.GetCurrentDirectory(), "Uploads"),
                $"{req.StorageId}.*");
            if (files.Length > 0)
            {
                var ext = Path.GetExtension(files[0]);
                msg.FileUrl = $"{baseUrl}/api/files/{req.StorageId}{ext}";
            }
        }

        db.Messages.Add(msg);

        // Mark all previous messages from others as read for the sender
        await db.Messages
            .Where(m => m.ChatId == id && m.SenderId != req.SenderId && !m.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsRead, true));

        await db.SaveChangesAsync();

        // Load reply info
        await db.Entry(msg).Reference(m => m.ReplyTo).LoadAsync();
        if (msg.ReplyTo != null)
            await db.Entry(msg.ReplyTo).Reference(r => r.Sender).LoadAsync();

        var dto = ToMessageDto(msg);

        // Broadcast via SignalR
        await hub.Clients.Group($"chat_{id}").SendAsync("NewMessage", dto);

        return Ok(dto);
    }

    // PUT /api/chats/{id}/messages/read
    [HttpPut("{id}/messages/read")]
    public async Task<IActionResult> MarkRead(string id, [FromBody] MarkReadRequest req)
    {
        await db.Messages
            .Where(m => m.ChatId == id && m.SenderId != req.UserId && !m.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsRead, true));
        return Ok();
    }

    // GET /api/chats/{id}/pinned
    [HttpGet("{id}/pinned")]
    public async Task<IActionResult> GetPinned(string id)
    {
        var pinned = await db.Messages
            .Where(m => m.ChatId == id && m.IsPinned)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
        return Ok(pinned.Select(ToMessageDto));
    }

    // PUT /api/messages/{msgId}/pin
    [HttpPut("/api/messages/{msgId}/pin")]
    public async Task<IActionResult> TogglePin(string msgId)
    {
        var msg = await db.Messages.FindAsync(msgId);
        if (msg == null) return NotFound();
        msg.IsPinned = !msg.IsPinned;
        await db.SaveChangesAsync();
        await hub.Clients.Group($"chat_{msg.ChatId}").SendAsync("MessagePinned", new { msgId, isPinned = msg.IsPinned });
        return Ok(new { isPinned = msg.IsPinned });
    }

    private static MessageDto ToMessageDto(Message m)
    {
        ReplyToDto? replyTo = null;
        if (m.ReplyTo != null)
        {
            replyTo = new ReplyToDto(
                m.ReplyTo.Id, m.ReplyTo.Text,
                m.ReplyTo.Sender?.DisplayName.Length > 0 ? m.ReplyTo.Sender.DisplayName : m.ReplyTo.Sender?.Username ?? "Unknown",
                m.ReplyTo.MessageType);
        }

        return new MessageDto(
            m.Id, m.ChatId, m.SenderId, m.Text,
            m.MessageType, m.FileUrl,
            m.ReplyToId, replyTo,
            m.IsPinned, m.IsRead, m.CreatedAt);
    }
}
