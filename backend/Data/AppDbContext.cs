using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Chat> Chats => Set<Chat>();
    public DbSet<ChatParticipant> ChatParticipants => Set<ChatParticipant>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<MessageReaction> MessageReactions => Set<MessageReaction>();
    public DbSet<Story> Stories => Set<Story>();
    public DbSet<StoryView> StoryViews => Set<StoryView>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // ChatParticipant composite key
        mb.Entity<ChatParticipant>()
            .HasKey(cp => new { cp.ChatId, cp.UserId });

        mb.Entity<ChatParticipant>()
            .HasOne(cp => cp.Chat).WithMany(c => c.Participants).HasForeignKey(cp => cp.ChatId);

        mb.Entity<ChatParticipant>()
            .HasOne(cp => cp.User).WithMany(u => u.ChatParticipants).HasForeignKey(cp => cp.UserId);

        // StoryView composite key
        mb.Entity<StoryView>()
            .HasKey(sv => new { sv.StoryId, sv.ViewerId });

        mb.Entity<StoryView>()
            .HasOne(sv => sv.Story).WithMany(s => s.Views).HasForeignKey(sv => sv.StoryId);

        // Message self-reference
        mb.Entity<Message>()
            .HasOne(m => m.ReplyTo).WithMany(m => m.Replies)
            .HasForeignKey(m => m.ReplyToId).OnDelete(DeleteBehavior.Restrict);

        // Message -> Chat
        mb.Entity<Message>()
            .HasOne(m => m.Chat).WithMany(c => c.Messages)
            .HasForeignKey(m => m.ChatId).OnDelete(DeleteBehavior.Cascade);

        // Message -> Sender (no cascade to avoid cycles)
        mb.Entity<Message>()
            .HasOne(m => m.Sender).WithMany(u => u.Messages)
            .HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.Restrict);

        // Reaction
        mb.Entity<MessageReaction>()
            .HasOne(r => r.Message).WithMany(m => m.Reactions)
            .HasForeignKey(r => r.MessageId).OnDelete(DeleteBehavior.Cascade);

        mb.Entity<MessageReaction>()
            .HasOne(r => r.User).WithMany(u => u.Reactions)
            .HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Restrict);

        // Story
        mb.Entity<Story>()
            .HasOne(s => s.User).WithMany(u => u.Stories)
            .HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);

        // Indexes
        mb.Entity<User>().HasIndex(u => u.Username).IsUnique();
        mb.Entity<User>().HasIndex(u => u.Email).IsUnique();
    }
}
