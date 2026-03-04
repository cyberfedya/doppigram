export type MessageType = 'text' | 'image' | 'video' | 'sticker' | 'video_message' | 'voice';
export type Theme = 'dark' | 'light';

export interface User {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  avatar?: string;
  avatarType?: 'emoji' | 'image';
  isAdmin: boolean;
  isVerified: boolean;
  isOnboarded: boolean;
  isOnline?: boolean;
  lastSeen?: number;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  text: string;
  messageType?: MessageType;
  fileUrl?: string;
  isRead: boolean;
  createdAt: number;
}

export interface Chat {
  _id: string;
  name: string;
  avatar?: string;
  lastMessage?: string | null;
  lastMessageType?: MessageType | null;
  lastMessageTime?: number | null;
  unreadCount: number;
  isGroup: boolean;
  isVerified?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
