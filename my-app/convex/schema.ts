import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Пользователи
  users: defineTable({
    uid: v.string(), // Firebase UID
    username: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    avatarType: v.optional(v.union(v.literal("emoji"), v.literal("image"))),
    isAdmin: v.boolean(),
    isOnline: v.boolean(),
    lastSeen: v.number(),
    createdAt: v.number(),
  })
    .index("by_uid", ["uid"])
    .index("by_username", ["username"]),

  // Чаты
  chats: defineTable({
    name: v.string(),
    isGroup: v.boolean(),
    avatar: v.optional(v.string()),
    createdBy: v.string(), // userId
    createdAt: v.number(),
  })
    .index("by_createdBy", ["createdBy"]),

  // Участники чатов
  chatParticipants: defineTable({
    chatId: v.id("chats"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_chatId", ["chatId"])
    .index("by_userId", ["userId"])
    .index("by_chatId_userId", ["chatId", "userId"]),

  // Сообщения
  messages: defineTable({
    chatId: v.id("chats"),
    senderId: v.id("users"),
    text: v.string(),
    image: v.optional(v.string()), // URL изображения
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_chatId", ["chatId"])
    .index("by_chatId_createdAt", ["chatId", "createdAt"]),

  // Запросы в друзья
  friendRequests: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    createdAt: v.number(),
  })
    .index("by_senderId", ["senderId"])
    .index("by_receiverId", ["receiverId"])
    .index("by_senderId_receiverId", ["senderId", "receiverId"]),
});
