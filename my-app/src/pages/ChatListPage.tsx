import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { useApp } from '../context/AppContext';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { MessageType } from '../types';
import { playMessageSound, playSendSound } from '../utils/sounds';
import {
  Search, MessageCircle, LogOut, Users, User,
  UsersRound, Send, Check, CheckCheck, X, Plus, Shield,
} from 'lucide-react';

/* ── Modal Overlay ────────────────────────────────────────── */
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="animate-slideUp" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

/* ── Profile Modal ───────────────────────────────────────── */
function ProfileModal({ user, onClose }: {
  user: { username: string; email: string; avatar?: string } | null;
  onClose: () => void;
}) {
  if (!user) return null;
  const initials = (user.username || 'U').slice(0, 2).toUpperCase();
  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 relative w-[90vw] max-w-sm text-center">
        <button onClick={onClose} className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#111] border border-[#222] text-[#555] flex items-center justify-center hover:bg-[#1a1a1a] hover:text-white transition-all">
          <X size={14} />
        </button>
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-black mx-auto mb-4 shadow-[0_0_40px_rgba(255,255,255,0.06)]">
          {user.avatar || initials}
        </div>
        <h2 className="text-xl font-bold text-white mb-1">{user.username}</h2>
        <p className="text-sm text-[#555] mb-5">{user.email}</p>
        <div className="border-t border-[#1a1a1a] pt-3 flex flex-col gap-0">
          <div className="flex justify-between items-center py-2.5 border-b border-[#111]">
            <span className="text-xs text-[#444] font-medium uppercase tracking-wider">Статус</span>
            <span className="text-sm text-white font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4ade80] inline-block" />онлайн
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5">
            <span className="text-xs text-[#444] font-medium uppercase tracking-wider">ID</span>
            <span className="text-xs font-mono text-[#666]">{user.username.toLowerCase().replace(/\s/g, '_')}</span>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ── Shared user list item ───────────────────────────────── */
function UserSelectRow({ user, selected, onToggle }: {
  user: { _id: string; username: string; avatar?: string; isOnline: boolean };
  selected: boolean;
  onToggle: () => void;
}) {
  const initials = user.username.slice(0, 2).toUpperCase();
  return (
    <button onClick={onToggle}
      className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl transition-all text-left ${selected ? 'bg-white/[0.05] border border-white/10' : 'hover:bg-white/[0.03] border border-transparent'}`}>
      <div className="relative w-9 h-9 rounded-full bg-[#222] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
        {user.avatar && user.avatar !== '👤' ? user.avatar : initials}
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${user.isOnline ? 'bg-[#4ade80]' : 'bg-[#333]'}`} />
      </div>
      <span className="flex-1 text-sm text-[#ccc] font-medium truncate">{user.username}</span>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'bg-white border-white' : 'border-[#333]'}`}>
        {selected && <Check size={11} className="text-black" />}
      </div>
    </button>
  );
}

/* ── Create Group Modal ──────────────────────────────────── */
function CreateGroupModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string, participantIds: Id<'users'>[]) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const allUsers = useQuery(api.users.getAllUsers) as Array<{ _id: string; username: string; avatar?: string; isOnline: boolean }> | undefined;
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  const filtered = (allUsers ?? []).filter(u => u.username.toLowerCase().includes(search.toLowerCase()));
  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handle = async () => { if (!name.trim() || selected.size === 0) return; setLoading(true); await onCreate(name.trim(), [...selected] as Id<'users'>[]); setLoading(false); };
  const canCreate = name.trim().length > 0 && selected.size > 0;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 relative w-[90vw] max-w-sm flex flex-col max-h-[85vh]">
        <button onClick={onClose} className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#111] border border-[#222] text-[#555] flex items-center justify-center hover:bg-[#1a1a1a] hover:text-white transition-all"><X size={14} /></button>
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-black mx-auto mb-3"><UsersRound size={22} /></div>
        <h2 className="text-[17px] font-bold text-white text-center mb-4">Создать группу</h2>
        <input ref={nameRef} type="text" placeholder="Название группы..." value={name} onChange={e => setName(e.target.value)} maxLength={50}
          className="w-full bg-[#111] border border-[#222] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#333] outline-none mb-3 transition-all focus:border-[#444]" />
        <div className="relative mb-2">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333]" />
          <input type="text" placeholder="Найти участников..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#111] border border-[#222] rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder-[#333] outline-none transition-all focus:border-[#444]" />
        </div>
        {selected.size > 0 && <p className="text-xs text-white font-semibold mb-1.5 px-0.5">Выбрано: {selected.size}</p>}
        <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 min-h-0 mb-4">
          {!allUsers ? <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
          : filtered.length === 0 ? <p className="text-center text-xs text-[#333] py-4">Нет пользователей</p>
          : filtered.map(u => <UserSelectRow key={u._id} user={u} selected={selected.has(u._id)} onToggle={() => toggle(u._id)} />)}
        </div>
        <button onClick={handle} disabled={!canCreate || loading}
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0 ${canCreate && !loading ? 'bg-white text-black hover:bg-[#e8e8e8] active:scale-[0.98]' : 'bg-[#111] border border-[#222] text-[#333] cursor-not-allowed'}`}>
          {loading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Plus size={15} /> Создать группу</>}
        </button>
      </div>
    </ModalOverlay>
  );
}

/* ── New Direct Chat Modal ────────────────────────────────── */
function NewChatModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (userId: Id<'users'>, username: string) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const allUsers = useQuery(api.users.getAllUsers) as Array<{ _id: string; username: string; avatar?: string; isOnline: boolean }> | undefined;
  const filtered = (allUsers ?? []).filter(u => u.username.toLowerCase().includes(search.toLowerCase()));
  const handleSelect = async (u: { _id: string; username: string }) => { setLoading(u._id); await onCreate(u._id as Id<'users'>, u.username); setLoading(null); };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 relative w-[90vw] max-w-sm flex flex-col max-h-[80vh]">
        <button onClick={onClose} className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#111] border border-[#222] text-[#555] flex items-center justify-center hover:bg-[#1a1a1a] hover:text-white transition-all"><X size={14} /></button>
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-black mx-auto mb-3"><MessageCircle size={22} /></div>
        <h2 className="text-[17px] font-bold text-white text-center mb-4">Новый чат</h2>
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#333]" />
          <input type="text" placeholder="Найти пользователя..." value={search} onChange={e => setSearch(e.target.value)} autoFocus
            className="w-full bg-[#111] border border-[#222] rounded-xl py-2.5 pl-8 pr-3 text-sm text-white placeholder-[#333] outline-none transition-all focus:border-[#444]" />
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 min-h-0">
          {!allUsers ? <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
          : filtered.length === 0 ? <p className="text-center text-xs text-[#333] py-4">Нет пользователей</p>
          : filtered.map(u => (
            <button key={u._id} onClick={() => handleSelect(u)} disabled={loading === u._id}
              className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all text-left border border-transparent hover:border-[#1a1a1a]">
              <div className="relative w-9 h-9 rounded-full bg-[#222] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {u.avatar && u.avatar !== '👤' ? u.avatar : u.username.slice(0, 2).toUpperCase()}
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${u.isOnline ? 'bg-[#4ade80]' : 'bg-[#333]'}`} />
              </div>
              <span className="flex-1 text-sm text-[#ccc] font-medium truncate">{u.username}</span>
              {loading === u._id ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <MessageCircle size={15} className="text-[#333]" />}
            </button>
          ))}
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

interface ConvexChatWithPreview {
  _id: string; name: string; avatar?: string; isGroup: boolean; createdAt: number;
  lastMessage: string | null; lastMessageType: string | null; lastMessageTime: number | null; unreadCount: number;
}

interface ConvexMsg {
  _id: string; senderId: string; text: string; messageType?: MessageType; fileUrl?: string; isRead: boolean; createdAt: number;
}

export function ChatListPage() {
  const { auth, logout, createChat } = useApp();
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
  const participantsStatus = useQuery(api.users.getChatParticipantsStatus, activeChatIdTyped && currentUserId ? { chatId: activeChatIdTyped, currentUserId } : 'skip') as Array<{ _id: string; username: string; isOnline: boolean; lastSeen: number }> | undefined;

  const sendMessageMut = useMutation(api.users.sendMessage);
  const markAsReadMut = useMutation(api.users.markMessagesAsRead);
  const setTypingMut = useMutation(api.users.setTyping);
  const clearTypingMut = useMutation(api.users.clearTyping);

  useEffect(() => {
    if (activeChatIdTyped && currentUserId) markAsReadMut({ chatId: activeChatIdTyped, userId: currentUserId }).catch(() => {});
  }, [activeChatIdTyped, currentUserId, chatMessages?.length, markAsReadMut]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages?.length]);

  // Play notification sound on new incoming messages
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
    if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}м`;
    if (h < 24) return `${h}ч`;
    if (d < 7) return `${d}д`;
    return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const fmtMsgTime = (ts: number) => new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const fmtDate = (ts: number) => {
    const days = Math.floor((Date.now() - ts) / 86400000);
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн. назад`;
    return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const getLastMsgPreview = (chat: ConvexChatWithPreview): string => {
    if (!chat.lastMessage) return 'Нет сообщений';
    const t = chat.lastMessageType ?? 'text';
    if (t === 'image') return '📷 Фото';
    if (t === 'video' || t === 'video_message') return '🎥 Видео';
    if (t === 'sticker') return `${chat.lastMessage}`;
    return chat.lastMessage;
  };

  const filteredChats = (convexChats ?? []).filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeChat = (convexChats ?? []).find(c => c._id === activeChatId);
  const initials = (auth.user?.username || 'U').slice(0, 2).toUpperCase();
  const typingText = typingUsers && typingUsers.length > 0 ? (typingUsers.length === 1 ? `${typingUsers[0]} печатает...` : `${typingUsers.length} чел. печатают...`) : null;

  const fmtLastSeen = (ts: number): string => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'только что';
    if (mins < 60) return `был(а) ${mins} мин. назад`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `был(а) ${hrs} ч. назад`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `был(а) ${days} дн. назад`;
    return `был(а) ${new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;
  };

  const getOnlineStatus = (): { text: string; isOnline: boolean } => {
    if (!participantsStatus || participantsStatus.length === 0) return { text: '', isOnline: false };
    if (activeChat?.isGroup) {
      const onlineCount = participantsStatus.filter(p => p.isOnline).length;
      return { text: `${participantsStatus.length + 1} уч., ${onlineCount} онлайн`, isOnline: onlineCount > 0 };
    }
    const other = participantsStatus[0];
    if (!other) return { text: '', isOnline: false };
    return other.isOnline ? { text: 'онлайн', isOnline: true } : { text: fmtLastSeen(other.lastSeen), isOnline: false };
  };

  const onlineStatus = getOnlineStatus();

  const navBtn = "flex items-center gap-3 px-5 py-3 text-[#666] text-sm font-medium cursor-pointer transition-all duration-200 select-none hover:bg-white/[0.03] hover:text-white";

  return (
    <>
      {showProfile && <ProfileModal user={auth.user} onClose={() => setShowProfile(false)} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} onCreate={async (name, pids) => { const id = await createChat(name, true, pids); setShowCreateGroup(false); if (id) setActiveChatId(id); }} />}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onCreate={async (uid, uname) => { const id = await createChat(uname, false, [uid]); setShowNewChat(false); if (id) setActiveChatId(id); }} />}

      <div className="flex h-screen w-screen overflow-hidden bg-black p-2.5 gap-2">

        {/* ══ LEFT NAV ══ */}
        <aside className="w-[220px] min-w-[220px] bg-[#0a0a0a] border border-[#151515] rounded-2xl flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-[#151515] flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[15px] font-bold text-black flex-shrink-0">
              {auth.user?.avatar || initials}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[14px] font-bold text-white truncate">{auth.user?.username}</span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#4ade80] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] inline-block" />онлайн
              </span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-1.5 flex flex-col">
            <button onClick={() => setShowProfile(true)} className={navBtn}><User size={17} /><span>Профиль</span></button>
            <button onClick={() => setShowNewChat(true)} className={navBtn}><MessageCircle size={17} /><span>Новый чат</span></button>
            <button onClick={() => setShowCreateGroup(true)} className={navBtn}><UsersRound size={17} /><span>Группа</span></button>
            <div className="h-px bg-[#151515] mx-5 my-1" />
            {auth.user?.isAdmin && (
              <button onClick={() => navigate('/vpp')} className={`${navBtn} text-[#888]`}><Shield size={17} /><span>Админ</span></button>
            )}
            <div className="flex-1" />
            <button onClick={logout} className={`${navBtn} text-[#555] hover:text-[#ff6b6b]`}><LogOut size={17} /><span>Выйти</span></button>
          </nav>
        </aside>

        {/* ══ CENTER CHAT ══ */}
        <main className="flex-1 bg-[#060606] border border-[#151515] rounded-2xl flex flex-col overflow-hidden min-w-0">
          {!activeChatId ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center animate-fadeIn">
              <div className="text-5xl opacity-[0.08] animate-float">💬</div>
              <h2 className="text-lg font-bold text-[#333]">Выберите чат</h2>
              <p className="text-sm text-[#222]">Выберите диалог, чтобы начать общение</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 bg-[#080808] border-b border-[#151515] flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-lg flex-shrink-0 border border-[#222]">
                  {activeChat?.avatar || '💬'}
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-[14px] font-bold text-white truncate">{activeChat?.name ?? '...'}</span>
                  <span className={`text-[11px] font-medium truncate ${typingText ? 'text-white animate-pulse-soft' : onlineStatus.isOnline ? 'text-[#4ade80]' : 'text-[#555]'}`}>
                    {typingText ?? onlineStatus.text}
                  </span>
                </div>
                <button onClick={() => navigate(`/chat/${activeChatId}`)} title="Полный экран"
                  className="text-[#333] hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.03]">
                  <Plus size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1 bg-[#060606]">
                {!chatMessages ? (
                  <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" /></div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-4xl opacity-[0.06] mb-3">💬</div>
                    <p className="text-sm font-semibold text-[#333] mb-1">Нет сообщений</p>
                    <p className="text-xs text-[#222]">Напишите первое!</p>
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
                              <span className="bg-[#111] border border-[#1a1a1a] text-[#444] text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">{fmtDate(msg.createdAt)}</span>
                            </div>
                          )}
                          {type === 'sticker' ? (
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} my-0.5`}>
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="text-4xl leading-none select-none">{msg.text}</span>
                                <span className="text-[9px] text-[#333]">{fmtMsgTime(msg.createdAt)}</span>
                              </div>
                            </div>
                          ) : type === 'image' && msg.fileUrl ? (
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} my-0.5`}>
                              <img src={msg.fileUrl} alt="фото" className="max-w-[180px] rounded-xl cursor-pointer border border-[#1a1a1a]" onClick={() => window.open(msg.fileUrl, '_blank')} />
                            </div>
                          ) : type === 'video' && msg.fileUrl ? (
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} my-0.5`}><video src={msg.fileUrl} controls className="max-w-[180px] rounded-xl" /></div>
                          ) : type === 'video_message' && msg.fileUrl ? (
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} my-0.5`}><video src={msg.fileUrl} controls playsInline className="w-24 h-24 rounded-full object-cover border-2 border-white/10" /></div>
                          ) : (
                            <div className={`flex max-w-[62%] animate-msgPop ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                              <div className={`px-3.5 py-2.5 rounded-2xl ${isMe ? 'bg-white text-black rounded-br-[4px]' : 'bg-[#111] text-[#ccc] border border-[#1a1a1a] rounded-bl-[4px]'}`}>
                                <p className="text-[13.5px] leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                                <div className="flex items-center gap-1 mt-1 justify-end">
                                  <span className={`text-[10px] font-medium ${isMe ? 'text-black/40' : 'text-[#333]'}`}>{fmtMsgTime(msg.createdAt)}</span>
                                  {isMe && (msg.isRead ? <CheckCheck size={12} className="text-black/50" /> : <Check size={12} className="text-black/30" />)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input bar */}
              <div className="flex items-end gap-2 px-4 py-3 bg-[#080808] border-t border-[#151515] flex-shrink-0">
                <div className="flex-1 bg-[#111] rounded-2xl px-3.5 py-2.5 flex items-end border border-[#1a1a1a] focus-within:border-[#333] transition-all">
                  <textarea ref={inputRef} placeholder="Сообщение..." value={messageText} onChange={handleInput} onKeyDown={handleKeyDown} rows={1}
                    className="w-full bg-transparent resize-none max-h-[120px] text-sm leading-relaxed py-0.5 text-white placeholder-[#333] outline-none" />
                </div>
                <button onClick={handleSend} disabled={!messageText.trim()}
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${messageText.trim() ? 'bg-white text-black hover:scale-105 active:scale-95' : 'bg-[#111] border border-[#1a1a1a] text-[#333] cursor-not-allowed'}`}>
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </main>

        {/* ══ RIGHT CHAT LIST ══ */}
        <section className="w-[280px] min-w-[250px] bg-[#0a0a0a] border border-[#151515] rounded-2xl flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-5 py-5 border-b border-[#151515] flex-shrink-0">
            <span className="text-[17px] font-bold text-white tracking-tight">Сообщения</span>
          </div>

          <div className="relative px-3 py-2 flex-shrink-0">
            <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#333] pointer-events-none" />
            <input type="text" placeholder="Поиск..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl py-2.5 pl-9 pr-3.5 text-[13px] text-white placeholder-[#333] outline-none transition-all focus:border-[#333]" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {!convexChats ? (
              <div className="flex items-center justify-center py-10"><div className="w-5 h-5 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" /></div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-[#222] text-sm text-center">
                <MessageCircle size={28} className="opacity-20" /><p>Нет чатов</p>
              </div>
            ) : filteredChats.map(chat => (
              <div key={chat._id} onClick={() => setActiveChatId(chat._id)}
                className={`relative flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-all duration-150 after:absolute after:bottom-0 after:left-[58px] after:right-3.5 after:h-px after:bg-[#111] ${activeChatId === chat._id ? 'bg-white/[0.04] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-white' : 'hover:bg-white/[0.02]'}`}>
                <div className="w-[42px] h-[42px] rounded-full bg-[#151515] border border-[#1a1a1a] flex items-center justify-center text-lg text-[#555] flex-shrink-0">
                  {chat.avatar || (chat.isGroup ? <Users size={18} /> : <MessageCircle size={18} />)}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex justify-between items-center gap-1.5">
                    <span className="text-[13.5px] font-semibold text-[#e0e0e0] truncate">{chat.name}</span>
                    <span className="text-[10px] text-[#333] font-medium flex-shrink-0">{fmtListTime(chat.lastMessageTime)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-1.5">
                    <span className="text-[12px] text-[#444] truncate">{getLastMsgPreview(chat)}</span>
                    {chat.unreadCount > 0 && (
                      <span className="bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center flex-shrink-0">
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
