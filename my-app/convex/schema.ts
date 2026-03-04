import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    uid: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    email: v.string(),
    password: v.string(),
    avatar: v.optional(v.string()),
    avatarType: v.optional(v.union(v.literal("emoji"), v.literal("image"))),
    isAdmin: v.boolean(),
    isVerified: v.optional(v.boolean()),
    isBanned: v.optional(v.boolean()),
    banReason: v.optional(v.string()),
    statusText: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
    createdAt: v.number(),
  })
    .index("by_uid", ["uid"])
    .index("by_username", ["username"]),

  chats: defineTable({
    name: v.string(),
    isGroup: v.boolean(),
    avatar: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_createdBy", ["createdBy"]),

  chatParticipants: defineTable({
    chatId: v.id("chats"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_chatId", ["chatId"])
    .index("by_userId", ["userId"])
    .index("by_chatId_userId", ["chatId", "userId"]),

  messages: defineTable({
    chatId: v.id("chats"),
    senderId: v.id("users"),
    text: v.string(),
    messageType: v.optional(v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
      v.literal("sticker"),
      v.literal("video_message"),
      v.literal("voice"),
    )),
    fileUrl: v.optional(v.string()),
    replyToId: v.optional(v.id("messages")),
    isPinned: v.optional(v.boolean()),
    pinnedBy: v.optional(v.id("users")),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_chatId", ["chatId"])
    .index("by_chatId_createdAt", ["chatId", "createdAt"]),

  typingIndicators: defineTable({
    chatId: v.id("chats"),
    userId: v.id("users"),
    username: v.string(),
    updatedAt: v.number(),
  })
    .index("by_chatId", ["chatId"])
    .index("by_chatId_userId", ["chatId", "userId"]),

  friendRequests: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    createdAt: v.number(),
  })
    .index("by_senderId", ["senderId"])
    .index("by_receiverId", ["receiverId"])
    .index("by_senderId_receiverId", ["senderId", "receiverId"]),

  stories: defineTable({
    userId: v.id("users"),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    text: v.optional(v.string()),
    storageId: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_expiresAt", ["expiresAt"]),

  storyViews: defineTable({
    storyId: v.id("stories"),
    viewerId: v.id("users"),
    viewedAt: v.number(),
  })
    .index("by_storyId", ["storyId"])
    .index("by_storyId_viewerId", ["storyId", "viewerId"]),

  messageReactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    reaction: v.string(),
    createdAt: v.number(),
  })
    .index("by_messageId", ["messageId"])
    .index("by_messageId_userId", ["messageId", "userId"]),
});
