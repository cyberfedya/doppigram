import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { MessageType } from '../types';
import { playMessageSound, playSendSound } from '../utils/sounds';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { TypingIndicator } from '../components/TypingIndicator';
import { StoryCircles } from '../components/StoryCircles';
import {
  Search, MessageCircle, LogOut, Users, User,
  UsersRound, Send, CheckCheck, X, Plus, Shield,
  Camera, Film, MessageSquare, Maximize2, Settings, Check,
} from 'lucide-react';

/* -- Modal Overlay ------------------------------------------------ */
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="animate-slideUp" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

/* -- Profile Modal ------------------------------------------------ */
function ProfileModal({ user, onClose }: {
  user: { username: string; displayName?: string; email: string; avatar?: string; isVerified?: boolean } | null;
  onClose: () => void;
}) {
  if (!user) return null;
  const name = user.displayName || user.username;
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <ModalOverlay onClose={onClose}>
      <div className="rounded-2xl p-6 relative w-[90vw] max-w-sm text-center" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--bg-border)' }}>
        <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-dim)' }}>
          <X size={13} />
        </button>
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3"
          style={{ background: 'var(--msg-me-bg)', color: 'var(--msg-me-text)' }}>
          {initials}
        </div>
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--tx-primary)' }}>{name}</h2>
          {user.isVerified && <VerifiedBadge size={16} />}
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--tx-muted)' }}>@{user.username}</p>
        <div className="pt-3" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <div className="flex justify-between items-center py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--tx-dim)' }}>Status</span>
            <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--tx-primary)' }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'var(--online)' }} />online
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--tx-dim)' }}>Doppi ID</span>
            <span className="text-xs font-mono" style={{ color: 'var(--tx-secondary)' }}>@{user.username}</span>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* -- Create Group Modal (Doppi ID based) -------------------------- */
function CreateGroupModal({ onClose, onCreate }: {
  onClose: () => void; onCreate: (name: string, participantIds: Id<'users'>[]) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [doppId, setDoppId] = useState('');
  const [members, setMembers] = useState<Array<{ _id: string; username: string; displayName?: string }>>([]);
  const [lookupError, setLookupError] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const lookupResult = useQuery(api.users.lookupByUsername, doppId.trim().length >= 3 ? { username: doppId.trim() } : 'skip') as { _id: string; username: string; displayName?: string; isOnline: boolean; isVerified: boolean } | null | undefined;
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  const addMember = () => {
    if (!lookupResult) { setLookupError('User not found'); return; }
    if (members.some(m => m._id === lookupResult._id)) { setLookupError('Already added'); return; }
    setMembers(prev => [...prev, { _id: lookupResult._id, username: lookupResult.username, displayName: lookupResult.displayName }]);
    setDoppId('');
    setLookupError('');
  };
  const removeMember = (id: string) => setMembers(prev => prev.filter(m => m._id !== id));
  const handle = async () => { if (!name.trim() || members.length === 0) return; setCreating(true); await onCreate(name.trim(), members.map(m => m._id) as Id<'users'>[]); setCreating(false); };
  const canCreate = name.trim().length > 0 && members.length > 0;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="rounded-2xl p-5 relative w-[90vw] max-w-sm flex flex-col max-h-[85vh]" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--bg-border)' }}>
        <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-dim)' }}><X size={13} /></button>
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--tx-primary)' }}>Create Group</h2>
        <input ref={nameRef} type="text" placeholder="Group name" value={name} onChange={e => setName(e.target.value)} maxLength={50}
          className="w-full rounded-xl px-3 py-2.5 text-sm mb-3 themed-border themed-border-focus"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} />
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--tx-dim)' }}>@</span>
            <input type="text" placeholder="doppi_id" value={doppId} onChange={e => { setDoppId(e.target.value.replace(/\s/g, '').toLowerCase()); setLookupError(''); }}
              className="w-full rounded-xl py-2 pl-7 pr-3 text-sm themed-border themed-border-focus"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMember(); } }} />
          </div>
          <button onClick={addMember} disabled={!lookupResult || loading}
            className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={lookupResult ? { backgroundColor: 'var(--accent)', color: 'var(--bg-base)' } : { backgroundColor: 'var(--bg-card)', color: 'var(--tx-dim)' }}>
            Add
          </button>
        </div>
        {lookupError && <p className="text-[11px] mb-2" style={{ color: 'var(--danger)' }}>{lookupError}</p>}
        {lookupResult && doppId.trim() && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--bg-border)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-primary)' }}>
              {(lookupResult.displayName || lookupResult.username).slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--tx-primary)' }}>{lookupResult.displayName || lookupResult.username}</p>
              <p className="text-[10px]" style={{ color: 'var(--tx-muted)' }}>@{lookupResult.username}</p>
            </div>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lookupResult.isOnline ? 'var(--online)' : 'var(--tx-dim)' }} />
          </div>
        )}
        {members.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {members.map(m => (
              <span key={m._id} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium"
                style={{ backgroundColor: 'var(--bg-active)', border: '1px solid var(--bg-border)', color: 'var(--tx-primary)' }}>
                {m.displayName || m.username}
                <button onClick={() => removeMember(m._id)} className="ml-0.5 opacity-60 hover:opacity-100"><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
        <button onClick={handle} disabled={!canCreate || creating}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={canCreate && !creating ? { background: 'var(--msg-me-bg)', color: 'var(--msg-me-text)' } : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-dim)', cursor: 'not-allowed' }}>
          {creating ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'transparent', borderTopColor: 'var(--msg-me-text)' }} /> : <><Plus size={15} /> Create Group</>}
        </button>
      </div>
    </ModalOverlay>
  );
}

/* -- New Direct Chat Modal (Doppi ID lookup) ---------------------- */
function NewChatModal({ onClose, onCreate }: {
  onClose: () => void; onCreate: (userId: Id<'users'>, username: string) => Promise<void>;
}) {
  const [doppId, setDoppId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lookupResult = useQuery(api.users.lookupByUsername, doppId.trim().length >= 3 ? { username: doppId.trim() } : 'skip') as { _id: string; username: string; displayName?: string; avatar?: string; isOnline: boolean; isVerified: boolean; statusText?: string } | null | undefined;

  const handleStart = async () => {
    if (!lookupResult) { setError('User not found'); return; }
    setLoading(true);
    await onCreate(lookupResult._id as Id<'users'>, lookupResult.displayName || lookupResult.username);
    setLoading(false);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="rounded-2xl p-5 relative w-[90vw] max-w-sm" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--bg-border)' }}>
        <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-dim)' }}><X size={13} /></button>
        <h2 className="text-base font-bold mb-1" style={{ color: 'var(--tx-primary)' }}>New Chat</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--tx-muted)' }}>Enter a Doppi ID to start a conversation</p>
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--tx-dim)' }}>@</span>
          <input type="text" placeholder="doppi_id" value={doppId}
            onChange={e => { setDoppId(e.target.value.replace(/\s/g, '').toLowerCase()); setError(''); }}
            autoFocus
            className="w-full rounded-xl py-2.5 pl-8 pr-3 text-sm themed-border themed-border-focus"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleStart(); } }} />
        </div>
        {error && <p className="text-[11px] mb-2" style={{ color: 'var(--danger)' }}>{error}</p>}
        {lookupResult && doppId.trim() && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl mb-3" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--bg-border)' }}>
            <div className="relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-primary)' }}>
              {(lookupResult.displayName || lookupResult.username).slice(0, 2).toUpperCase()}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full" style={{ border: '2px solid var(--bg-panel)', backgroundColor: lookupResult.isOnline ? 'var(--online)' : 'var(--tx-dim)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold truncate" style={{ color: 'var(--tx-primary)' }}>{lookupResult.displayName || lookupResult.username}</span>
                {lookupResult.isVerified && <VerifiedBadge size={13} />}
              </div>
              <p className="text-[11px]" style={{ color: 'var(--tx-muted)' }}>@{lookupResult.username}</p>
            </div>
          </div>
        )}
        {lookupResult === null && doppId.trim().length >= 3 && (
          <p className="text-xs text-center py-3" style={{ color: 'var(--tx-dim)' }}>No user found with this Doppi ID</p>
        )}
        <button onClick={handleStart} disabled={!lookupResult || loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          style={lookupResult ? { background: 'var(--msg-me-bg)', color: 'var(--msg-me-text)' } : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-dim)', cursor: 'not-allowed' }}>
          {loading ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'transparent', borderTopColor: 'var(--msg-me-text)' }} /> : <><MessageCircle size={15} /> Start Chat</>}
        </button>
      </div>
    </ModalOverlay>
  );
}

/* -- Main Page ---------------------------------------------------- */

interface ConvexChatWithPreview {
  _id: string; name: string; avatar?: string; isGroup: boolean; isVerified?: boolean; createdAt: number;
  lastMessage: string | null; lastMessageType: string | null; lastMessageTime: number | null; unreadCount: number;
}

interface ConvexMsg {
  _id: string; senderId: string; text: string; messageType?: MessageType; fileUrl?: string; isRead: boolean; createdAt: number;
}

export function ChatListPage() {
  const { auth, logout, createChat } = useApp();
  const { chatBackground } = useTheme();
  const navigate = useNavigate();
  const currentUserId = auth.user?.id as Id<'users'> | undefined;

  const convexChats = useQuery(api.users.getChatsWithLastMessage, currentUserId ? { userId: currentUserId } : 'skip') as ConvexChatWithPreview[] | undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prevMsgCountRef = useRef<number>(0);

  const activeChatIdTyped = activeChatId as Id<'chats'> | null;

  const chatMessages = useQuery(api.users.getMessagesForChat, activeChatIdTyped && currentUserId ? { chatId: activeChatIdTyped, limit: 100 } : 'skip') as ConvexMsg[] | undefined;
  const typingUsers = useQuery(api.users.getTypingUsers, activeChatIdTyped && currentUserId ? { chatId: activeChatIdTyped, currentUserId } : 'skip') as string[] | undefined;
  const participantsStatus = useQuery(api.users.getChatParticipantsStatus, activeChatIdTyped && currentUserId ? { chatId: activeChatIdTyped, currentUserId } : 'skip') as Array<{ _id: string; username: string; displayName?: string; isOnline: boolean; lastSeen: number; isVerified: boolean }> | undefined;

  const sendMessageMut = useMutation(api.users.sendMessage);
  const markAsReadMut = useMutation(api.users.markMessagesAsRead);
  const setTypingMut = useMutation(api.users.setTyping);
  const clearTypingMut = useMutation(api.users.clearTyping);

  useEffect(() => {
    if (activeChatIdTyped && currentUserId) markAsReadMut({ chatId: activeChatIdTyped, userId: currentUserId }).catch(() => {});
  }, [activeChatIdTyped, currentUserId, chatMessages?.length, markAsReadMut]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages?.length]);

  useEffect(() => {
    if (!chatMessages) return;
    const count = chatMessages.length;
    if (prevMsgCountRef.current > 0 && count > prevMsgCountRef.current) {
      const last = chatMessages[count - 1];
      if (last && last.senderId !== currentUserId) playMessageSound();
    }
    prevMsgCountRef.current = count;
  }, [chatMessages, currentUserId]);

  useEffect(() => {
    return () => { clearTimeout(typingTimeoutRef.current); if (activeChatIdTyped && currentUserId) clearTypingMut({ chatId: activeChatIdTyped, userId: currentUserId }).catch(() => {}); };
  }, [activeChatIdTyped, currentUserId, clearTypingMut]);

  const handleTypingStart = useCallback(() => {
    if (!activeChatIdTyped || !currentUserId || !auth.user?.username) return;
    setTypingMut({ chatId: activeChatIdTyped, userId: currentUserId, username: auth.user.username }).catch(() => {});
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { if (activeChatIdTyped && currentUserId) clearTypingMut({ chatId: activeChatIdTyped, userId: currentUserId }).catch(() => {}); }, 3000);
  }, [activeChatIdTyped, currentUserId, auth.user?.username, setTypingMut, clearTypingMut]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    handleTypingStart();
  };

  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !activeChatIdTyped || !currentUserId) return;
    const text = messageText.trim();
    setMessageText('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    clearTimeout(typingTimeoutRef.current);
    clearTypingMut({ chatId: activeChatIdTyped, userId: currentUserId }).catch(() => {});
    playSendSound();
    await sendMessageMut({ chatId: activeChatIdTyped, senderId: currentUserId, text, messageType: 'text' });
  }, [messageText, activeChatIdTyped, currentUserId, sendMessageMut, clearTypingMut]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const fmtListTime = (ts: number | null): string => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
    if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}m`;
    if (h < 24) return `${h}h`;
    if (d < 7) return `${d}d`;
    return new Date(ts).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const fmtMsgTime = (ts: number) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const fmtDate = (ts: number) => {
    const days = Math.floor((Date.now() - ts) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(ts).toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
  };

  const getLastMsgPreview = (chat: ConvexChatWithPreview): string => {
    if (!chat.lastMessage) return 'No messages';
    const t = chat.lastMessageType ?? 'text';
    if (t === 'image') return 'Photo';
    if (t === 'video' || t === 'video_message') return 'Video';
    if (t === 'sticker') return `${chat.lastMessage}`;
    return chat.lastMessage;
  };

  const filteredChats = (convexChats ?? []).filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeChatRaw = (convexChats ?? []).find(c => c._id === activeChatId);
  const otherUser = activeChatRaw && !activeChatRaw.isGroup && participantsStatus && participantsStatus.length > 0 ? participantsStatus[0] : null;
  const activeChat = activeChatRaw ? { ...activeChatRaw, name: otherUser ? ((otherUser as any).displayName || otherUser.username) : activeChatRaw.name, isVerified: otherUser ? otherUser.isVerified : false } : undefined;
  const initials = (auth.user?.displayName || auth.user?.username || 'U').slice(0, 2).toUpperCase();
  const typingNames = typingUsers ?? [];

  const fmtLastSeen = (ts: number): string => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `last seen ${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `last seen ${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `last seen ${days}d ago`;
    return `last seen ${new Date(ts).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
  };

  const getOnlineStatus = (): { text: string; isOnline: boolean } => {
    if (!participantsStatus || participantsStatus.length === 0) return { text: '', isOnline: false };
    if (activeChat?.isGroup) {
      const onlineCount = participantsStatus.filter(p => p.isOnline).length;
      return { text: `${participantsStatus.length + 1} members, ${onlineCount} online`, isOnline: onlineCount > 0 };
    }
    const other = participantsStatus[0];
    if (!other) return { text: '', isOnline: false };
    return other.isOnline ? { text: 'online', isOnline: true } : { text: fmtLastSeen(other.lastSeen), isOnline: false };
  };

  const onlineStatus = getOnlineStatus();

  return (
    <>
      {showProfile && <ProfileModal user={auth.user ? { ...auth.user, isVerified: auth.user.isVerified } : null} onClose={() => setShowProfile(false)} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} onCreate={async (name, pids) => { const id = await createChat(name, true, pids); setShowCreateGroup(false); if (id) setActiveChatId(id); }} />}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onCreate={async (uid, uname) => { const id = await createChat(uname, false, [uid]); setShowNewChat(false); if (id) setActiveChatId(id); }} />}

      <div className="flex h-screen w-screen overflow-hidden p-2.5 gap-2" style={{ backgroundColor: 'var(--bg-base)' }}>

        {/* LEFT NAV */}
        <aside className="w-[220px] min-w-[220px] rounded-2xl flex flex-col overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--bg-border)' }}>
          <div className="flex items-center gap-3 px-5 py-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--bg-border)' }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-bold flex-shrink-0"
              style={{ background: 'var(--msg-me-bg)', color: 'var(--msg-me-text)' }}>
              {initials}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[14px] font-bold truncate" style={{ color: 'var(--tx-primary)' }}>{auth.user?.displayName || auth.user?.username}</span>
                {auth.user?.isVerified && <VerifiedBadge size={14} />}
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--online)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'var(--online)' }} />online
              </span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-1.5 flex flex-col">
            {[
              { icon: <User size={17} />, label: 'Profile', onClick: () => setShowProfile(true) },
              { icon: <MessageCircle size={17} />, label: 'New Chat', onClick: () => setShowNewChat(true) },
              { icon: <UsersRound size={17} />, label: 'Group', onClick: () => setShowCreateGroup(true) },
            ].map((item, i) => (
              <button key={i} onClick={item.onClick}
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-200 select-none"
                style={{ color: 'var(--tx-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--tx-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--tx-secondary)'; }}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
            <div className="h-px mx-5 my-1" style={{ backgroundColor: 'var(--bg-border)' }} />
            {auth.user?.isAdmin && (
              <button onClick={() => navigate('/vpp')}
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-200 select-none"
                style={{ color: 'var(--accent-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <Shield size={17} /><span>Admin</span>
              </button>
            )}
            <button onClick={() => navigate('/settings')}
              className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-200 select-none"
              style={{ color: 'var(--tx-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--tx-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--tx-secondary)'; }}>
              <Settings size={17} /><span>Settings</span>
            </button>
            <div className="flex-1" />
            <button onClick={logout}
              className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all duration-200 select-none"
              style={{ color: 'var(--tx-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--tx-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
              <LogOut size={17} /><span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* CENTER CHAT */}
        <main className="flex-1 rounded-2xl flex flex-col overflow-hidden min-w-0" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
          {!activeChatId ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center animate-fadeIn">
              <div className="opacity-[0.15] animate-float"><MessageSquare size={48} style={{ color: 'var(--accent)' }} /></div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--tx-dim)' }}>Select a chat</h2>
              <p className="text-sm" style={{ color: 'var(--tx-ghost)' }}>Choose a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--bg-border)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
                  {activeChat?.isGroup ? <Users size={18} style={{ color: 'var(--accent-secondary)' }} /> : <User size={18} style={{ color: 'var(--accent)' }} />}
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-bold truncate" style={{ color: 'var(--tx-primary)' }}>{activeChat?.name ?? '...'}</span>
                    {activeChat?.isVerified && <VerifiedBadge size={14} />}
                  </div>
                  <span className="text-[11px] font-medium truncate"
                    style={{ color: typingNames.length > 0 ? 'var(--accent)' : onlineStatus.isOnline ? 'var(--online)' : 'var(--tx-muted)' }}>
                    {typingNames.length > 0 ? <TypingIndicator names={typingNames} /> : onlineStatus.text}
                  </span>
                </div>
                <button onClick={() => navigate(`/chat/${activeChatId}`)} title="Fullscreen"
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--tx-dim)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--tx-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--tx-dim)'; }}>
                  <Maximize2 size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1" style={{ backgroundColor: 'var(--bg-surface)', background: chatBackground || undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {!chatMessages ? (
                  <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--bg-border)', borderTopColor: 'var(--accent)' }} /></div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare size={32} className="opacity-[0.08] mb-3" style={{ color: 'var(--accent)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--tx-dim)' }}>No messages</p>
                    <p className="text-xs" style={{ color: 'var(--tx-ghost)' }}>Write the first one!</p>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg, i) => {
                      const isMe = msg.senderId === currentUserId;
                      const type = msg.messageType ?? 'text';
                      const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(chatMessages[i - 1].createdAt).toDateString();
                      return (
                        <div key={msg._id}>
                          {showDate && (
                            <div className="flex justify-center my-3">
                              <span className="text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider"
                                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-muted)' }}>{fmtDate(msg.createdAt)}</span>
                            </div>
                          )}
                          <div className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} my-0.5`}>
                            {type === 'sticker' ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="text-4xl leading-none select-none">{msg.text}</span>
                                <span className="text-[9px]" style={{ color: 'var(--tx-dim)' }}>{fmtMsgTime(msg.createdAt)}</span>
                              </div>
                            ) : type === 'image' && msg.fileUrl ? (
                              <img src={msg.fileUrl} alt="photo" className="max-w-[180px] rounded-xl cursor-pointer" style={{ border: '1px solid var(--bg-border)' }} onClick={() => window.open(msg.fileUrl, '_blank')} />
                            ) : type === 'video' && msg.fileUrl ? (
                              <video src={msg.fileUrl} controls className="max-w-[180px] rounded-xl" />
                            ) : type === 'video_message' && msg.fileUrl ? (
                              <video src={msg.fileUrl} controls playsInline className="w-24 h-24 rounded-full object-cover" style={{ border: '2px solid var(--bg-border)' }} />
                            ) : (
                              <div className="max-w-[62%] animate-msgPop">
                                <div className={`px-3.5 py-2.5 rounded-2xl ${isMe ? 'msg-me rounded-br-[4px]' : 'rounded-bl-[4px]'}`}
                                  style={!isMe ? { backgroundColor: 'var(--msg-other-bg)', border: '1px solid var(--msg-other-border)', color: 'var(--msg-other-text)' } : undefined}>
                                  <p className="text-[13.5px] leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                                  <div className="flex items-center gap-1 mt-1 justify-end">
                                    <span className="text-[10px] font-medium" style={{ opacity: 0.5 }}>{fmtMsgTime(msg.createdAt)}</span>
                                    {isMe && (msg.isRead ? <CheckCheck size={12} style={{ opacity: 0.6 }} /> : <Check size={12} style={{ opacity: 0.4 }} />)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input bar */}
              <div className="flex items-end gap-2 px-4 py-3 flex-shrink-0" style={{ backgroundColor: 'var(--bg-panel)', borderTop: '1px solid var(--bg-border)' }}>
                <div className="flex-1 rounded-2xl px-3.5 py-2.5 flex items-end themed-border themed-border-focus" style={{ backgroundColor: 'var(--bg-input)' }}>
                  <textarea ref={inputRef} placeholder="Message..." value={messageText} onChange={handleInput} onKeyDown={handleKeyDown} rows={1}
                    className="w-full bg-transparent resize-none max-h-[120px] text-sm leading-relaxed py-0.5 placeholder-current"
                    style={{ color: 'var(--tx-primary)', ['--tw-placeholder-opacity' as string]: 1 }} />
                </div>
                <button onClick={handleSend} disabled={!messageText.trim()}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={messageText.trim() ? { background: 'var(--msg-me-bg)', color: 'var(--msg-me-text)' } : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-dim)', cursor: 'not-allowed' }}>
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </main>

        {/* RIGHT CHAT LIST */}
        <section className="w-[280px] min-w-[250px] rounded-2xl flex flex-col overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--bg-border)' }}>
          <div className="px-5 py-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--bg-border)' }}>
            <span className="text-[17px] font-bold tracking-tight" style={{ color: 'var(--tx-primary)' }}>Messages</span>
          </div>

          <StoryCircles />

          <div className="relative px-3 py-2 flex-shrink-0">
            <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--tx-dim)' }} />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl py-2.5 pl-9 pr-3.5 text-[13px] transition-all themed-border themed-border-focus"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} />
          </div>

          <div className="flex-1 overflow-y-auto">
            {!convexChats ? (
              <div className="flex items-center justify-center py-10"><div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--bg-border)', borderTopColor: 'var(--accent)' }} /></div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-sm text-center" style={{ color: 'var(--tx-ghost)' }}>
                <MessageCircle size={28} className="opacity-20" /><p>No chats</p>
              </div>
            ) : filteredChats.map(chat => (
              <div key={chat._id} onClick={() => setActiveChatId(chat._id)}
                className="relative flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-all duration-150"
                style={{
                  backgroundColor: activeChatId === chat._id ? 'var(--bg-active)' : 'transparent',
                  borderLeft: activeChatId === chat._id ? '2px solid var(--accent)' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (activeChatId !== chat._id) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (activeChatId !== chat._id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
                  {chat.isGroup ? <Users size={18} style={{ color: 'var(--accent-secondary)' }} /> : <User size={18} style={{ color: 'var(--accent)' }} />}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex justify-between items-center gap-1.5">
                    <div className="flex items-center gap-1 truncate">
                      <span className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--tx-primary)' }}>{chat.name}</span>
                      {chat.isVerified && <VerifiedBadge size={12} />}
                    </div>
                    <span className="text-[10px] font-medium flex-shrink-0" style={{ color: 'var(--tx-dim)' }}>{fmtListTime(chat.lastMessageTime)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-1.5">
                    <span className="text-[12px] truncate flex items-center gap-1" style={{ color: 'var(--tx-muted)' }}>
                      {chat.lastMessageType === 'image' && <Camera size={11} />}
                      {(chat.lastMessageType === 'video' || chat.lastMessageType === 'video_message') && <Film size={11} />}
                      {getLastMsgPreview(chat)}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0"
                        style={{ background: 'var(--msg-me-bg)', color: 'var(--msg-me-text)' }}>
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
