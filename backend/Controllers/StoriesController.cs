using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/stories")]
public class StoriesController(AppDbContext db) : ControllerBase
{
    // GET /api/stories?viewerId=xxx
    [HttpGet]
    public async Task<IActionResult> GetActive([FromQuery] string viewerId)
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        var stories = await db.Stories
            .Where(s => s.ExpiresAt > now)
            .Include(s => s.User)
            .Include(s => s.Views)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();

        // Get IDs of users who share a chat with viewer
        var chatUserIds = await db.ChatParticipants
            .Where(cp => cp.UserId == viewerId)
            .SelectMany(cp => db.ChatParticipants
                .Where(cp2 => cp2.ChatId == cp.ChatId && cp2.UserId != viewerId)
                .Select(cp2 => cp2.UserId))
            .Distinct()
            .ToListAsync();

        // Include own stories + contacts
        var visibleStories = stories.Where(s =>
            s.UserId == viewerId || chatUserIds.Contains(s.UserId)).ToList();

        var groups = visibleStories
            .GroupBy(s => s.UserId)
            .Select(g =>
            {
                var user = g.First().User;
                var storyList = g.OrderBy(s => s.CreatedAt).ToList();
                var allViewed = storyList.All(s => s.Views.Any(v => v.ViewerId == viewerId));
                return new StoryGroupDto(
                    user.Id, user.Username, user.DisplayName.Length > 0 ? user.DisplayName : null,
                    user.Avatar, user.IsVerified, allViewed,
                    storyList.Select(s => new StoryDto(
                        s.Id, s.MediaUrl, s.MediaType, s.Text, s.CreatedAt, s.ExpiresAt)).ToList(),
                    storyList.Max(s => s.CreatedAt));
            })
            .OrderBy(g => g.AllViewed)
            .ThenByDescending(g => g.LatestAt)
            .ToList();

        return Ok(groups);
    }

    // POST /api/stories
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStoryRequest req)
    {
        var story = new Story
        {
            Id = Guid.NewGuid().ToString(),
            UserId = req.UserId,
            StorageId = req.StorageId,
            MediaType = req.MediaType,
            Text = req.Text,
        };

        // Resolve media URL from storageId
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
                story.MediaUrl = $"{baseUrl}/api/files/{req.StorageId}{ext}";
            }
        }

        db.Stories.Add(story);
        await db.SaveChangesAsync();
        return Ok(new { id = story.Id });
    }

    // POST /api/stories/{id}/view
    [HttpPost("{id}/view")]
    public async Task<IActionResult> View(string id, [FromBody] ViewStoryRequest req)
    {
        var exists = await db.StoryViews.AnyAsync(sv => sv.StoryId == id && sv.ViewerId == req.ViewerId);
        if (!exists)
        {
            db.StoryViews.Add(new StoryView { StoryId = id, ViewerId = req.ViewerId });
            await db.SaveChangesAsync();
        }
        return Ok();
    }

    // DELETE /api/stories/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var story = await db.Stories.FindAsync(id);
        if (story == null) return NotFound();
        db.Stories.Remove(story);
        await db.SaveChangesAsync();
        return Ok();
    }
}

public record ViewStoryRequest(string ViewerId);
