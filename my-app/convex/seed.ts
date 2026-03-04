import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword } from "./lib";

export const createInitialAdmin = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      uid: 'admin_' + args.username,
      username: args.username,
      displayName: args.username,
      email: `${args.username}@admin.com`,
      password: hashPassword(args.password),
      isAdmin: true,
      isVerified: true,
      isBanned: false,
      isOnline: false,
      lastSeen: Date.now(),
      createdAt: Date.now(),
    });
  },
});
