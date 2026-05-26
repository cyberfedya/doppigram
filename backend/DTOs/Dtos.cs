namespace backend.DTOs;

// ─── Auth ──────────────────────────────────────────────────────────────────
public record LoginRequest(string Username, string Password);
public record CreateUserRequest(string Username, string Password, string? DisplayName, string? Email, bool IsAdmin);
public record InitAdminRequest(string Username, string Password);

public record AuthResponse(string Token, UserDto User);

// ─── User ──────────────────────────────────────────────────────────────────
public record UserDto(
    string Id, string Username, string DisplayName, string Email,
    string? Avatar, string? AvatarType,
    bool IsAdmin, bool IsVerified, bool IsBanned, string? BanReason,
    bool IsOnline, long LastSeen, string? StatusText, long CreatedAt);

public record UpdateUserRequest(string Username, string? Password, string? Avatar, string? AvatarType);
public record UpdateDisplayNameRequest(string DisplayName);
public record UpdateUsernameRequest(string NewUsername);
public record UpdateStatusRequest(string StatusText);
public record SetOnlineRequest(bool IsOnline);
public record BanRequest(string? Reason);

// ─── Chat ──────────────────────────────────────────────────────────────────
public record CreateChatRequest(string Name, bool IsGroup, string CreatedBy, List<string> ParticipantIds);

public record ChatDto(
    string Id, string Name, bool IsGroup, bool IsVerified,
    long CreatedAt, string? LastMessage, string? LastMessageType,
    long? LastMessageTime, int UnreadCount);

public record ChatInfoDto(string Id, string Name, bool IsGroup);

public record ParticipantStatusDto(
    string Id, string Username, string? DisplayName,
    bool IsOnline, long LastSeen, bool IsVerified);

// ─── Message ──────────────────────────────────────────────────────────────
public record SendMessageRequest(
    string SenderId, string Text, string MessageType,
    string? StorageId, string? ReplyToId);

public record MessageDto(
    string Id, string ChatId, string SenderId, string Text,
    string MessageType, string? FileUrl,
    string? ReplyToId, ReplyToDto? ReplyTo,
    bool IsPinned, bool IsRead, long CreatedAt);

public record ReplyToDto(string Id, string Text, string SenderName, string MessageType);

public record MarkReadRequest(string UserId);
public record TogglePinRequest(string UserId);

// ─── Reaction ─────────────────────────────────────────────────────────────
public record ToggleReactionRequest(string MessageId, string UserId, string Reaction);
public record ReactionDto(string Reaction, string UserId, string Username);

// ─── Story ────────────────────────────────────────────────────────────────
public record CreateStoryRequest(
    string UserId, string? StorageId, string? MediaType, string? Text);

public record StoryDto(
    string Id, string? MediaUrl, string? MediaType,
    string? Text, long CreatedAt, long ExpiresAt);

public record StoryGroupDto(
    string UserId, string Username, string? DisplayName,
    string? Avatar, bool IsVerified, bool AllViewed,
    List<StoryDto> Stories, long LatestAt);

// ─── File ─────────────────────────────────────────────────────────────────
public record UploadUrlResponse(string UploadUrl, string StorageId);

// ─── SignalR ──────────────────────────────────────────────────────────────
public record SignalRMessage(
    string Id, string ChatId, string SenderId, string Text,
    string MessageType, string? FileUrl,
    string? ReplyToId, ReplyToDto? ReplyTo,
    bool IsPinned, bool IsRead, long CreatedAt);

public record TypingEvent(string ChatId, string UserId, string Username);
public record ReadEvent(string ChatId, string UserId);
public record OnlineEvent(string UserId, bool IsOnline);
