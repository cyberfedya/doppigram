import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    reaction: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if this user already has this reaction
    const existing = await ctx.db
      .query("messageReactions")
      .withIndex("by_messageId_userId", q => q.eq("messageId", args.messageId).eq("userId", args.userId))
      .collect();

    const sameReaction = existing.find(r => r.reaction === args.reaction);
    if (sameReaction) {
      // Remove the reaction (toggle off)
      await ctx.db.delete(sameReaction._id);
      return null;
    }

    // Remove any other reaction from this user on this message
    for (const r of existing) {
      await ctx.db.delete(r._id);
    }

    // Add new reaction
    return await ctx.db.insert("messageReactions", {
      messageId: args.messageId,
      userId: args.userId,
      reaction: args.reaction,
      createdAt: Date.now(),
    });
  },
});

export const getReactionsForMessages = query({
  args: { messageIds: v.array(v.id("messages")) },
  handler: async (ctx, args) => {
    const result: Record<string, Array<{ reaction: string; userId: string; username: string }>> = {};

    for (const messageId of args.messageIds) {
      const reactions = await ctx.db
        .query("messageReactions")
        .withIndex("by_messageId", q => q.eq("messageId", messageId))
        .collect();

      if (reactions.length > 0) {
        const withUsers = await Promise.all(
          reactions.map(async r => {
            const user = await ctx.db.get(r.userId);
            return { reaction: r.reaction, userId: r.userId as string, username: user?.username ?? "Unknown" };
          })
        );
        result[messageId] = withUsers;
      }
    }

    return result;
  },
});
