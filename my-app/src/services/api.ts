const BASE = import.meta.env.VITE_API_URL ?? '';

// ─── helpers ───────────────────────────────────────────────────────────────

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('doppigram_token');
  const headers: Record<string, string> = {
    ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let err = `HTTP ${res.status}`;
    try { const j = await res.json(); err = j?.error ?? err; } catch { /* ignore */ }
    throw new Error(err);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const get = <T>(path: string) => req<T>(path);
const post = <T>(path: string, body?: unknown) =>
  req<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined });
const put = <T>(path: string, body?: unknown) =>
  req<T>(path, { method: 'PUT', body: body != null ? JSON.stringify(body) : undefined });
const del = <T>(path: string) => req<T>(path, { method: 'DELETE' });

// ─── types ─────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string; username: string; displayName: string; email: string;
  avatar?: string; avatarType?: string;
  isAdmin: boolean; isVerified: boolean; isBanned: boolean; banReason?: string;
  isOnline: boolean; lastSeen: number; statusText?: string; createdAt: number;
}

export interface ApiChat {
  id: string; name: string; isGroup: boolean; isVerified: boolean; createdAt: number;
  lastMessage?: string; lastMessageType?: string; lastMessageTime?: number; unreadCount: number;
}

export interface ApiMessage {
  id: string; chatId: string; senderId: string; text: string;
  messageType: string; fileUrl?: string; replyToId?: string;
  replyTo?: { id: string; text: string; senderName: string; messageType: string };
  isPinned: boolean; isRead: boolean; createdAt: number;
}

export interface ApiParticipant {
  id: string; username: string; displayName: string;
  isOnline: boolean; lastSeen: number; isVerified: boolean;
}

export interface ApiStoryGroup {
  userId: string; username: string; displayName?: string; avatar?: string;
  isVerified: boolean; allViewed: boolean; latestAt: number;
  stories: Array<{ id: string; mediaUrl?: string; mediaType?: string; text?: string; createdAt: number; expiresAt: number }>;
}

export interface ApiReaction { reaction: string; userId: string; username: string; }

// ─── auth ──────────────────────────────────────────────────────────────────

export const auth = {
  login: (username: string, password: string) =>
    post<{ token: string; user: ApiUser }>('/api/auth/login', { username, password }),
  register: (username: string, password: string, displayName?: string, email?: string) =>
    post<{ id: string }>('/api/auth/register', { username, password, displayName, email }),
  initAdmin: (username: string, password: string) =>
    post<{ message: string }>('/api/auth/init-admin', { username, password }),
};

// ─── users ─────────────────────────────────────────────────────────────────

export const users = {
  getAll: () => get<ApiUser[]>('/api/users'),
  lookup: (username: string) => get<ApiUser | null>(`/api/users/lookup?username=${encodeURIComponent(username)}`),
  delete: (id: string) => del(`/api/users/${id}`),
  toggleAdmin: (id: string) => put<ApiUser>(`/api/users/${id}/toggle-admin`),
  toggleVerified: (id: string) => put<ApiUser>(`/api/users/${id}/toggle-verified`),
  ban: (id: string, reason?: string) => post(`/api/users/${id}/ban`, { reason }),
  unban: (id: string) => post(`/api/users/${id}/unban`),
  update: (id: string, data: { username: string; password?: string; avatar?: string; avatarType?: string }) =>
    put<ApiUser>(`/api/users/${id}`, data),
  updateDisplayName: (id: string, displayName: string) =>
    put<ApiUser>(`/api/users/${id}/display-name`, { displayName }),
  updateUsername: (id: string, newUsername: string) =>
    put<ApiUser>(`/api/users/${id}/username`, { newUsername }),
  updateStatus: (id: string, statusText?: string) =>
    put(`/api/users/${id}/status`, { statusText }),
  setOnline: (id: string, isOnline: boolean) =>
    put(`/api/users/${id}/online`, { isOnline }),
};

// ─── chats ─────────────────────────────────────────────────────────────────

export const chats = {
  getAll: (userId: string) => get<ApiChat[]>(`/api/chats?userId=${userId}`),
  getOne: (id: string) => get<{ id: string; name: string; isGroup: boolean }>(`/api/chats/${id}`),
  create: (name: string, isGroup: boolean, createdBy: string, participantIds: string[]) =>
    post<{ id: string }>('/api/chats', { name, isGroup, createdBy, participantIds }),
  getParticipants: (chatId: string, currentUserId: string) =>
    get<ApiParticipant[]>(`/api/chats/${chatId}/participants-status?currentUserId=${currentUserId}`),
  getMessages: (chatId: string, limit = 100) =>
    get<ApiMessage[]>(`/api/chats/${chatId}/messages?limit=${limit}`),
  sendMessage: (chatId: string, senderId: string, text: string, messageType = 'text', storageId?: string, replyToId?: string) =>
    post<ApiMessage>(`/api/chats/${chatId}/messages`, { senderId, text, messageType, storageId, replyToId }),
  markRead: (chatId: string, userId: string) =>
    put(`/api/chats/${chatId}/messages/read`, { userId }),
  getPinned: (chatId: string) => get<ApiMessage[]>(`/api/chats/${chatId}/pinned`),
  togglePin: (msgId: string) => put<{ isPinned: boolean }>(`/api/messages/${msgId}/pin`),
};

// ─── reactions ─────────────────────────────────────────────────────────────

export const reactions = {
  get: (messageIds: string[]) =>
    get<Record<string, ApiReaction[]>>(`/api/reactions?messageIds=${messageIds.join(',')}`),
  toggle: (messageId: string, userId: string, reaction: string) =>
    post('/api/reactions/toggle', { messageId, userId, reaction }),
};

// ─── stories ───────────────────────────────────────────────────────────────

export const stories = {
  getActive: (viewerId: string) => get<ApiStoryGroup[]>(`/api/stories?viewerId=${viewerId}`),
  create: (userId: string, storageId?: string, mediaType?: string, text?: string) =>
    post<{ id: string }>('/api/stories', { userId, storageId, mediaType, text }),
  view: (id: string, viewerId: string) =>
    post(`/api/stories/${id}/view`, { viewerId }),
  delete: (id: string) => del(`/api/stories/${id}`),
};

// ─── files ─────────────────────────────────────────────────────────────────

export const files = {
  upload: async (file: File): Promise<{ storageId: string; fileUrl: string }> => {
    const token = localStorage.getItem('doppigram_token');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/api/files/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },
};
