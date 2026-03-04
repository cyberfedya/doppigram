import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Простая хэш-функция для демо (в продакшене используйте bcrypt)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash).toString(36);
}

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
    password: v.string(),
    avatar: v.optional(v.string()),
    avatarType: v.optional(v.union(v.literal("emoji"), v.literal("image"))),
    isAdmin: v.boolean(),
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
      password: hashPassword(args.password),
      avatar: args.avatar,
      avatarType: args.avatarType,
      isAdmin: args.isAdmin,
      isOnline: true,
      lastSeen: Date.now(),
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const loginUser = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!user) {
      return null;
    }

    const hashedPassword = hashPassword(args.password);
    if (user.password !== hashedPassword) {
      return null;
    }

    // Устанавливаем онлайн-статус при логине
    await ctx.db.patch(user._id, { isOnline: true, lastSeen: Date.now() });

    return {
      _id: user._id,
      uid: user.uid,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      avatarType: user.avatarType,
      isAdmin: user.isAdmin,
      isOnline: true,
      lastSeen: Date.now(),
      createdAt: user.createdAt,
    };
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    avatarType: v.optional(v.union(v.literal("emoji"), v.literal("image"))),
    isOnline: v.optional(v.boolean()),
    password: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, {
      ...updates,
      ...(updates.password ? { password: hashPassword(updates.password) } : {}),
    });
  },
});

export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
  },
});

export const toggleUserAdmin = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        isAdmin: !user.isAdmin,
      });
    }
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

export const getChatParticipantsStatus = query({
  args: { chatId: v.id("chats"), currentUserId: v.id("users") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .collect();

    const others = participants.filter((p) => p.userId !== args.currentUserId);
    const users = await Promise.all(
      others.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        if (!user) return null;
        return {
          _id: user._id,
          username: user.username,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
        };
      })
    );
    return users.filter(Boolean);
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

    // Добавляем создателя + всех участников (без дубликатов)
    const allParticipants = [...new Set([args.createdBy, ...participantIds])];
    for (const userId of allParticipants) {
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
    messageType: v.optional(v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
      v.literal("sticker"),
      v.literal("video_message"),
    )),
    storageId: v.optional(v.id("_storage")),
    fileUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let resolvedFileUrl = args.fileUrl;
    if (args.storageId && !resolvedFileUrl) {
      resolvedFileUrl = (await ctx.storage.getUrl(args.storageId)) ?? undefined;
    }
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      senderId: args.senderId,
      text: args.text,
      messageType: args.messageType ?? "text",
      fileUrl: resolvedFileUrl,
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
    // Only mark messages from OTHER users as read (not my own)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isRead"), false),
          q.neq(q.field("senderId"), args.userId)
        )
      )
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

// ════════════════════════════════════════════════════════════
// CHATS WITH LAST MESSAGE (for chat list)
// ════════════════════════════════════════════════════════════

export const getChatsWithLastMessage = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("chatParticipants")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const chatIds = participants.map((p) => p.chatId);

    const chatsWithData = await Promise.all(
      chatIds.map(async (chatId) => {
        const chat = await ctx.db.get(chatId);
        if (!chat) return null;

        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_chatId_createdAt", (q) => q.eq("chatId", chatId))
          .order("desc")
          .first();

        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
          .filter((q) =>
            q.and(
              q.neq(q.field("senderId"), args.userId),
              q.eq(q.field("isRead"), false)
            )
          )
          .collect();

        // For 1-on-1 chats, show the OTHER user's name and avatar
        let displayName = chat.name;
        let displayAvatar = chat.avatar;
        if (!chat.isGroup) {
          const chatParticipants = await ctx.db
            .query("chatParticipants")
            .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
            .collect();
          const otherParticipant = chatParticipants.find((p) => p.userId !== args.userId);
          if (otherParticipant) {
            const otherUser = await ctx.db.get(otherParticipant.userId);
            if (otherUser) {
              displayName = otherUser.username;
              displayAvatar = otherUser.avatar;
            }
          }
        }

        return {
          _id: chat._id,
          name: displayName,
          avatar: displayAvatar,
          isGroup: chat.isGroup,
          createdAt: chat.createdAt,
          lastMessage: lastMessage?.text ?? null,
          lastMessageType: lastMessage?.messageType ?? "text",
          lastMessageTime: lastMessage?.createdAt ?? null,
          unreadCount: unreadMessages.length,
        };
      })
    );

    return chatsWithData
      .filter(Boolean)
      .sort((a, b) => (b!.lastMessageTime ?? 0) - (a!.lastMessageTime ?? 0));
  },
});

// ════════════════════════════════════════════════════════════
// TYPING INDICATORS
// ════════════════════════════════════════════════════════════

export const setTyping = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_chatId_userId", (q) =>
        q.eq("chatId", args.chatId).eq("userId", args.userId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { updatedAt: Date.now() });
    } else {
      await ctx.db.insert("typingIndicators", {
        chatId: args.chatId,
        userId: args.userId,
        username: args.username,
        updatedAt: Date.now(),
      });
    }
  },
});

export const clearTyping = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_chatId_userId", (q) =>
        q.eq("chatId", args.chatId).eq("userId", args.userId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getTypingUsers = query({
  args: {
    chatId: v.id("chats"),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const fiveSecondsAgo = Date.now() - 5000;
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .filter((q) => q.neq(q.field("userId"), args.currentUserId))
      .filter((q) => q.gt(q.field("updatedAt"), fiveSecondsAgo))
      .collect();

    return indicators.map((i) => i.username);
  },
});

// ════════════════════════════════════════════════════════════
// USER STATUS
// ════════════════════════════════════════════════════════════

export const setUserOnline = mutation({
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
