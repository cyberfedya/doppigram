using backend.Data;
using backend.DTOs;
using backend.Hubs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/reactions")]
public class ReactionsController(AppDbContext db, IHubContext<ChatHub> hub) : ControllerBase
{
    // GET /api/reactions?messageIds=id1,id2,...
    [HttpGet]
    public async Task<IActionResult> GetReactions([FromQuery] string messageIds)
    {
        var ids = messageIds.Split(',', StringSplitOptions.RemoveEmptyEntries);
        var reactions = await db.MessageReactions
            .Where(r => ids.Contains(r.MessageId))
            .Include(r => r.User)
            .ToListAsync();

        var grouped = reactions
            .GroupBy(r => r.MessageId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(r => new ReactionDto(r.Reaction, r.UserId, r.User.Username)).ToList());

        return Ok(grouped);
    }

    // POST /api/reactions/toggle
    [HttpPost("toggle")]
    public async Task<IActionResult> Toggle([FromBody] ToggleReactionRequest req)
    {
        var existing = await db.MessageReactions
            .FirstOrDefaultAsync(r => r.MessageId == req.MessageId
                && r.UserId == req.UserId
                && r.Reaction == req.Reaction);

        if (existing != null)
        {
            db.MessageReactions.Remove(existing);
        }
        else
        {
            db.MessageReactions.Add(new MessageReaction
            {
                Id = Guid.NewGuid().ToString(),
                MessageId = req.MessageId,
                UserId = req.UserId,
                Reaction = req.Reaction
            });
        }

        await db.SaveChangesAsync();

        // Get the chat for broadcasting
        var msg = await db.Messages.FindAsync(req.MessageId);
        if (msg != null)
        {
            await hub.Clients.Group($"chat_{msg.ChatId}")
                .SendAsync("ReactionUpdated", new { messageId = req.MessageId });
        }

        return Ok();
    }
}
