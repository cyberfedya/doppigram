import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════

export const getUserByUid = query({
  args: { uid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .unique();
    return user;
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    return user;
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const createUser = mutation({
  args: {
    uid: v.string(),
    username: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    avatarType: v.optional(v.union(v.literal("emoji"), v.literal("image"))),
  },
  handler: async (ctx, args) => {
    // Проверяем, существует ли уже пользователь
    const existing = await ctx.db
      .query("users")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .unique();

    if (existing) {
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      uid: args.uid,
      username: args.username,
      email: args.email,
      avatar: args.avatar,
      avatarType: args.avatarType,
      isAdmin: false,
      isOnline: true,
      lastSeen: Date.now(),
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    avatarType: v.optional(v.union(v.literal("emoji"), v.literal("image"))),
    isOnline: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isOnline: args.isOnline,
      lastSeen: Date.now(),
    });
  },
});

// ════════════════════════════════════════════════════════════
// CHATS
// ════════════════════════════════════════════════════════════

export const getChatsForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("chatParticipants")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const chatIds = participants.map((p) => p.chatId);
    const chats = await Promise.all(chatIds.map((id) => ctx.db.get(id)));

    return chats.filter(Boolean);
  },
});

export const getChatById = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chatId);
  },
});

export const createChat = mutation({
  args: {
    name: v.string(),
    isGroup: v.boolean(),
    avatar: v.optional(v.string()),
    createdBy: v.id("users"),
    participantIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { participantIds, ...chatData } = args;

    const chatId = await ctx.db.insert("chats", {
      ...chatData,
      createdAt: Date.now(),
    });

    // Добавляем всех участников
    for (const userId of participantIds) {
      await ctx.db.insert("chatParticipants", {
        chatId,
        userId,
        joinedAt: Date.now(),
      });
    }

    return chatId;
  },
});

export const addParticipantToChat = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chatId_userId", (q) =>
        q.eq("chatId", args.chatId).eq("userId", args.userId)
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("chatParticipants", {
        chatId: args.chatId,
        userId: args.userId,
        joinedAt: Date.now(),
      });
    }
  },
});

export const getChatParticipants = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .collect();

    const users = await Promise.all(
      participants.map((p) => ctx.db.get(p.userId))
    );

    return users.filter(Boolean);
  },
});

// ════════════════════════════════════════════════════════════
// MESSAGES
// ════════════════════════════════════════════════════════════

export const getMessagesForChat = query({
  args: { chatId: v.id("chats"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId_createdAt", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .take(limit);

    return messages.reverse();
  },
});

export const sendMessage = mutation({
  args: {
    chatId: v.id("chats"),
    senderId: v.id("users"),
    text: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

export const markMessagesAsRead = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    for (const msg of messages) {
      await ctx.db.patch(msg._id, { isRead: true });
    }
  },
});

export const getUnreadCount = query({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .filter((q) => q.neq(q.field("senderId"), args.userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    return messages.length;
  },
});

// ════════════════════════════════════════════════════════════
// FRIEND REQUESTS
// ════════════════════════════════════════════════════════════

export const sendFriendRequest = mutation({
  args: {
    senderId: v.id("users"),
    receiverId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("friendRequests")
      .withIndex("by_senderId_receiverId", (q) =>
        q.eq("senderId", args.senderId).eq("receiverId", args.receiverId)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("friendRequests", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const getFriendRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_receiverId", (q) => q.eq("receiverId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const senders = await Promise.all(
      requests.map((r) => ctx.db.get(r.senderId))
    );

    return senders.filter(Boolean);
  },
});

export const acceptFriendRequest = mutation({
  args: { requestId: v.id("friendRequests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, { status: "accepted" });
  },
});
