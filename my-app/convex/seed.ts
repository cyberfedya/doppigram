import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Простая хэш-функция (такая же как в users.ts)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash).toString(36);
}

// Мутация для создания первого админа (запустить один раз)
export const createInitialAdmin = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Проверяем, существует ли уже пользователь
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existing) {
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      uid: 'admin_' + args.username,
      username: args.username,
      email: `${args.username}@admin.com`,
      password: hashPassword(args.password),
      avatar: '👑',
      avatarType: 'emoji',
      isAdmin: true,
      isOnline: false,
      lastSeen: Date.now(),
      createdAt: Date.now(),
    });

    return userId;
  },
});
