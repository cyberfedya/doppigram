import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const STORY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const createStory = mutation({
  args: {
    userId: v.id("users"),
    text: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let mediaUrl: string | undefined;
    if (args.storageId) {
      mediaUrl = await ctx.storage.getUrl(args.storageId) ?? undefined;
    }
    return await ctx.db.insert("stories", {
      userId: args.userId,
      text: args.text,
      mediaUrl,
      mediaType: args.mediaType,
      storageId: args.storageId as string | undefined,
      createdAt: now,
      expiresAt: now + STORY_DURATION_MS,
    });
  },
});

export const getActiveStories = query({
  args: { viewerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const allStories = await ctx.db.query("stories").collect();
    const active = allStories.filter(s => s.expiresAt > now);

    // Group by user
    const userMap = new Map<Id<"users">, typeof active>();
    for (const story of active) {
      const uid = story.userId;
      if (!userMap.has(uid)) userMap.set(uid, []);
      userMap.get(uid)!.push(story);
    }

    // Get user info
    const result = [];
    for (const [userId, stories] of userMap) {
      const user = await ctx.db.get(userId);
      if (!user) continue;

      let allViewed = false;
      if (args.viewerId && userId !== args.viewerId) {
        allViewed = true;
        for (const s of stories) {
          const view = await ctx.db
            .query("storyViews")
            .withIndex("by_storyId_viewerId", q => q.eq("storyId", s._id).eq("viewerId", args.viewerId!))
            .first();
          if (!view) { allViewed = false; break; }
        }
      }

      result.push({
        userId,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        isVerified: user.isVerified ?? false,
        stories: stories.sort((a, b) => a.createdAt - b.createdAt),
        latestAt: Math.max(...stories.map(s => s.createdAt)),
        allViewed,
      });
    }

    return result.sort((a, b) => b.latestAt - a.latestAt);
  },
});

export const viewStory = mutation({
  args: {
    storyId: v.id("stories"),
    viewerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("storyViews")
      .withIndex("by_storyId_viewerId", q => q.eq("storyId", args.storyId).eq("viewerId", args.viewerId))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("storyViews", {
      storyId: args.storyId,
      viewerId: args.viewerId,
      viewedAt: Date.now(),
    });
  },
});

export const getStoryViews = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_storyId", q => q.eq("storyId", args.storyId))
      .collect();
    const result = [];
    for (const view of views) {
      const user = await ctx.db.get(view.viewerId);
      if (user) result.push({ viewerId: view.viewerId, username: user.username, displayName: user.displayName, viewedAt: view.viewedAt });
    }
    return result;
  },
});

export const deleteStory = mutation({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    // Delete views first
    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_storyId", q => q.eq("storyId", args.storyId))
      .collect();
    for (const view of views) {
      await ctx.db.delete(view._id);
    }
    await ctx.db.delete(args.storyId);
  },
});

export const getUserStories = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const stories = await ctx.db
      .query("stories")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .collect();
    return stories.filter(s => s.expiresAt > now).sort((a, b) => a.createdAt - b.createdAt);
  },
});
