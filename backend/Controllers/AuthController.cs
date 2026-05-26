using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, IConfiguration config) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Username == req.Username.ToLower().Trim());

        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { error = "Invalid credentials" });

        if (user.IsBanned)
            return Unauthorized(new { error = $"Account banned: {user.BanReason ?? "No reason provided"}" });

        user.IsOnline = true;
        user.LastSeen = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        await db.SaveChangesAsync();

        var token = GenerateToken(user);
        return Ok(new AuthResponse(token, ToDto(user)));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] CreateUserRequest req)
    {
        var username = req.Username.ToLower().Trim();

        if (await db.Users.AnyAsync(u => u.Username == username))
            return BadRequest(new { error = "USERNAME_TAKEN" });

        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Username = username,
            DisplayName = req.DisplayName ?? username,
            Email = req.Email ?? $"{username}@doppigram.app",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            IsAdmin = req.IsAdmin
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return Ok(new { id = user.Id });
    }

    [HttpPost("init-admin")]
    public async Task<IActionResult> InitAdmin([FromBody] InitAdminRequest req)
    {
        if (await db.Users.AnyAsync(u => u.IsAdmin))
            return BadRequest(new { error = "Admin already exists" });

        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Username = req.Username.ToLower().Trim(),
            DisplayName = req.Username,
            Email = $"{req.Username}@doppigram.app",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            IsAdmin = true
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return Ok(new { message = "Admin created" });
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("isAdmin", user.IsAdmin.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static UserDto ToDto(User u) => new(
        u.Id, u.Username, u.DisplayName, u.Email,
        u.Avatar, u.AvatarType,
        u.IsAdmin, u.IsVerified, u.IsBanned, u.BanReason,
        u.IsOnline, u.LastSeen, u.StatusText, u.CreatedAt);
}
