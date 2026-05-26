using backend.Data;
using backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await db.Users.OrderBy(u => u.CreatedAt).ToListAsync();
        return Ok(users.Select(AuthController.ToDto));
    }

    [HttpGet("lookup")]
    public async Task<IActionResult> Lookup([FromQuery] string username)
    {
        var user = await db.Users.FirstOrDefaultAsync(
            u => u.Username == username.ToLower().Trim() && !u.IsBanned);
        if (user == null) return Ok((object?)null);
        return Ok(AuthController.ToDto(user));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();
        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("{id}/toggle-admin")]
    public async Task<IActionResult> ToggleAdmin(string id)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsAdmin = !user.IsAdmin;
        await db.SaveChangesAsync();
        return Ok(AuthController.ToDto(user));
    }

    [HttpPut("{id}/toggle-verified")]
    public async Task<IActionResult> ToggleVerified(string id)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsVerified = !user.IsVerified;
        await db.SaveChangesAsync();
        return Ok(AuthController.ToDto(user));
    }

    [HttpPost("{id}/ban")]
    public async Task<IActionResult> Ban(string id, [FromBody] BanRequest req)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsBanned = true;
        user.BanReason = req.Reason ?? "Banned by admin";
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/unban")]
    public async Task<IActionResult> Unban(string id)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsBanned = false;
        user.BanReason = null;
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest req)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();

        var newUsername = req.Username.ToLower().Trim();
        if (newUsername != user.Username && await db.Users.AnyAsync(u => u.Username == newUsername && u.Id != id))
            return BadRequest(new { error = "USERNAME_TAKEN" });

        user.Username = newUsername;
        if (!string.IsNullOrEmpty(req.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
        if (req.Avatar != null) user.Avatar = req.Avatar;
        if (req.AvatarType != null) user.AvatarType = req.AvatarType;

        await db.SaveChangesAsync();
        return Ok(AuthController.ToDto(user));
    }

    [HttpPut("{id}/display-name")]
    public async Task<IActionResult> UpdateDisplayName(string id, [FromBody] UpdateDisplayNameRequest req)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.DisplayName = req.DisplayName.Trim();
        await db.SaveChangesAsync();
        return Ok(AuthController.ToDto(user));
    }

    [HttpPut("{id}/username")]
    public async Task<IActionResult> UpdateUsername(string id, [FromBody] UpdateUsernameRequest req)
    {
        var newUsername = req.NewUsername.ToLower().Trim();
        if (!System.Text.RegularExpressions.Regex.IsMatch(newUsername, @"^[a-z0-9_]{3,20}$"))
            return BadRequest(new { error = "INVALID_USERNAME" });

        if (await db.Users.AnyAsync(u => u.Username == newUsername && u.Id != id))
            return BadRequest(new { error = "USERNAME_TAKEN" });

        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.Username = newUsername;
        await db.SaveChangesAsync();
        return Ok(AuthController.ToDto(user));
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusRequest req)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.StatusText = req.StatusText;
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("{id}/online")]
    public async Task<IActionResult> SetOnline(string id, [FromBody] SetOnlineRequest req)
    {
        var user = await db.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsOnline = req.IsOnline;
        user.LastSeen = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await db.SaveChangesAsync();
        return Ok();
    }
}
