import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { hashPassword } from "./lib";

// ════════════════════════════════════════════════════════════
// QUERIES
// ════════════════════════════════════════════════════════════

export const getUserByUid = query({
  args: { uid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .unique();
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
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// ════════════════════════════════════════════════════════════
// MUTATIONS
// ════════════════════════════════════════════════════════════

export const createUser = mutation({
  args: {
    uid: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    email: v.string(),
    password: v.string(),
    avatar: v.optional(v.string()),
    avatarType: v.optional(v.union(v.literal("emoji"), v.literal("image"))),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_uid", (q) => q.eq("uid", args.uid))
      .unique();
    if (existing) return existing._id;

    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (existingUsername) throw new Error("USERNAME_TAKEN");

    return await ctx.db.insert("users", {
      uid: args.uid,
      username: args.username,
      displayName: args.displayName,
      email: args.email,
      password: hashPassword(args.password),
      avatar: args.avatar,
      avatarType: args.avatarType,
      isAdmin: args.isAdmin,
      isVerified: false,
      isBanned: false,
      isOnline: true,
      lastSeen: Date.now(),
      createdAt: Date.now(),
    });
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

    if (!user) return null;

    if (user.isBanned) {
      throw new Error("BANNED:" + (user.banReason || "Your account has been permanently banned."));
    }

    const hashedPassword = hashPassword(args.password);
    if (user.password !== hashedPassword) return null;

    await ctx.db.patch(user._id, { isOnline: true, lastSeen: Date.now() });

    return {
      _id: user._id,
      uid: user.uid,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      avatarType: user.avatarType,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified ?? false,
      isBanned: false,
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
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
  },
});

export const toggleUserAdmin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, { isAdmin: !user.isAdmin });
    }
  },
});

export const toggleUserVerified = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, { isVerified: !(user.isVerified ?? false) });
    }
  },
});

export const banUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isBanned: true,
      banReason: args.reason ?? "Permanently banned by admin.",
      isOnline: false,
    });
  },
});

export const unbanUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isBanned: false,
      banReason: undefined,
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
    const chats = await Promise.all(participants.map((p) => ctx.db.get(p.chatId)));
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
          displayName: user.displayName,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          isVerified: user.isVerified ?? false,
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
    const allParticipants = [...new Set([args.createdBy, ...participantIds])];
    for (const userId of allParticipants) {
      await ctx.db.insert("chatParticipants", { chatId, userId, joinedAt: Date.now() });
    }
    return chatId;
  },
});

export const addParticipantToChat = mutation({
  args: { chatId: v.id("chats"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chatParticipants")
      .withIndex("by_chatId_userId", (q) => q.eq("chatId", args.chatId).eq("userId", args.userId))
      .unique();
    if (!existing) {
      await ctx.db.insert("chatParticipants", { chatId: args.chatId, userId: args.userId, joinedAt: Date.now() });
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
    const users = await Promise.all(participants.map((p) => ctx.db.get(p.userId)));
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
    const sorted = messages.reverse();

    // Resolve reply snippets
    const result = await Promise.all(
      sorted.map(async (msg) => {
        if (!msg.replyToId) return { ...msg, replyTo: null };
        const replyMsg = await ctx.db.get(msg.replyToId);
        if (!replyMsg) return { ...msg, replyTo: null };
        const replyUser = await ctx.db.get(replyMsg.senderId);
        return {
          ...msg,
          replyTo: {
            _id: replyMsg._id,
            text: replyMsg.text.slice(0, 100),
            senderName: replyUser?.displayName || replyUser?.username || "Unknown",
            messageType: replyMsg.messageType ?? "text",
          },
        };
      })
    );
    return result;
  },
});

export const sendMessage = mutation({
  args: {
    chatId: v.id("chats"),
    senderId: v.id("users"),
    text: v.string(),
    messageType: v.optional(v.union(
      v.literal("text"), v.literal("image"), v.literal("video"),
      v.literal("sticker"), v.literal("video_message"),
    )),
    storageId: v.optional(v.id("_storage")),
    fileUrl: v.optional(v.string()),
    replyToId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    let resolvedFileUrl = args.fileUrl;
    if (args.storageId && !resolvedFileUrl) {
      resolvedFileUrl = (await ctx.storage.getUrl(args.storageId)) ?? undefined;
    }
    return await ctx.db.insert("messages", {
      chatId: args.chatId,
      senderId: args.senderId,
      text: args.text,
      messageType: args.messageType ?? "text",
      fileUrl: resolvedFileUrl,
      replyToId: args.replyToId,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const markMessagesAsRead = mutation({
  args: { chatId: v.id("chats"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .filter((q) => q.and(q.eq(q.field("isRead"), false), q.neq(q.field("senderId"), args.userId)))
      .collect();
    for (const msg of messages) {
      await ctx.db.patch(msg._id, { isRead: true });
    }
  },
});

export const getUnreadCount = query({
  args: { chatId: v.id("chats"), userId: v.id("users") },
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

export const togglePinMessage = mutation({
  args: { messageId: v.id("messages"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.messageId);
    if (!msg) return;
    await ctx.db.patch(args.messageId, {
      isPinned: !(msg.isPinned ?? false),
      pinnedBy: msg.isPinned ? undefined : args.userId,
    });
  },
});

export const getPinnedMessages = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .collect();
    return messages.filter(m => m.isPinned);
  },
});

export const searchMessages = query({
  args: { chatId: v.id("chats"), query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chatId_createdAt", (q) => q.eq("chatId", args.chatId))
      .collect();
    const q = args.query.toLowerCase();
    return messages.filter(m => m.text.toLowerCase().includes(q)).reverse().slice(0, 20);
  },
});

export const updateStatusText = mutation({
  args: { userId: v.id("users"), statusText: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { statusText: args.statusText || undefined });
  },
});

export const updateDisplayName = mutation({
  args: { userId: v.id("users"), displayName: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { displayName: args.displayName || undefined });
  },
});

export const updateUsername = mutation({
  args: { userId: v.id("users"), newUsername: v.string() },
  handler: async (ctx, args) => {
    const username = args.newUsername.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      throw new Error("INVALID_USERNAME");
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (existing && existing._id !== args.userId) {
      throw new Error("USERNAME_TAKEN");
    }
    await ctx.db.patch(args.userId, { username });
  },
});

export const lookupByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const username = args.username.toLowerCase().trim().replace(/^@/, "");
    if (!username) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!user) return null;
    return {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      avatarType: user.avatarType,
      isOnline: user.isOnline,
      isVerified: user.isVerified ?? false,
      statusText: user.statusText,
    };
  },
});

// ════════════════════════════════════════════════════════════
// FRIEND REQUESTS
// ════════════════════════════════════════════════════════════

export const sendFriendRequest = mutation({
  args: { senderId: v.id("users"), receiverId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("friendRequests")
      .withIndex("by_senderId_receiverId", (q) => q.eq("senderId", args.senderId).eq("receiverId", args.receiverId))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("friendRequests", {
      senderId: args.senderId, receiverId: args.receiverId, status: "pending", createdAt: Date.now(),
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
    const senders = await Promise.all(requests.map((r) => ctx.db.get(r.senderId)));
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
// CHATS WITH LAST MESSAGE
// ════════════════════════════════════════════════════════════

export const getChatsWithLastMessage = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("chatParticipants")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const chatsWithData = await Promise.all(
      participants.map(async ({ chatId }) => {
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
          .filter((q) => q.and(q.neq(q.field("senderId"), args.userId), q.eq(q.field("isRead"), false)))
          .collect();

        let displayName = chat.name;
        let displayAvatar = chat.avatar;
        let otherUserVerified = false;
        if (!chat.isGroup) {
          const chatParticipants = await ctx.db
            .query("chatParticipants")
            .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
            .collect();
          const otherParticipant = chatParticipants.find((p) => p.userId !== args.userId);
          if (otherParticipant) {
            const otherUser = await ctx.db.get(otherParticipant.userId);
            if (otherUser) {
              displayName = otherUser.displayName || otherUser.username;
              displayAvatar = otherUser.avatar;
              otherUserVerified = otherUser.isVerified ?? false;
            }
          }
        }

        return {
          _id: chat._id,
          name: displayName,
          avatar: displayAvatar,
          isGroup: chat.isGroup,
          isVerified: otherUserVerified,
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
  args: { chatId: v.id("chats"), userId: v.id("users"), username: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_chatId_userId", (q) => q.eq("chatId", args.chatId).eq("userId", args.userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { updatedAt: Date.now() });
    } else {
      await ctx.db.insert("typingIndicators", {
        chatId: args.chatId, userId: args.userId, username: args.username, updatedAt: Date.now(),
      });
    }
  },
});

export const clearTyping = mutation({
  args: { chatId: v.id("chats"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_chatId_userId", (q) => q.eq("chatId", args.chatId).eq("userId", args.userId))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const getTypingUsers = query({
  args: { chatId: v.id("chats"), currentUserId: v.id("users") },
  handler: async (ctx, args) => {
    const fiveSecondsAgo = Date.now() - 5000;
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .filter((q) => q.neq(q.field("userId"), args.currentUserId))
      .filter((q) => q.gt(q.field("updatedAt"), fiveSecondsAgo))
      .collect();
    const names = await Promise.all(
      indicators.map(async (i) => {
        const user = await ctx.db.get(i.userId);
        return user?.displayName || user?.username || i.username;
      })
    );
    return names;
  },
});
