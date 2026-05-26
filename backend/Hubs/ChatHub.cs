using Microsoft.AspNetCore.SignalR;

namespace backend.Hubs;

public class ChatHub : Hub
{
    public async Task JoinChat(string chatId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"chat_{chatId}");
    }

    public async Task LeaveChat(string chatId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"chat_{chatId}");
    }

    public async Task SetTyping(string chatId, string userId, string username)
    {
        await Clients.OthersInGroup($"chat_{chatId}")
            .SendAsync("TypingStart", new { chatId, userId, username });
    }

    public async Task ClearTyping(string chatId, string userId)
    {
        await Clients.OthersInGroup($"chat_{chatId}")
            .SendAsync("TypingStop", new { chatId, userId });
    }

    public async Task JoinUserGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
    }
}
