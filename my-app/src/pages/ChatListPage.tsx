import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Chat as ChatType, Message as MessageType } from '../types';
import {
  Search, MessageCircle, Settings, LogOut, Users, User,
  UsersRound, Moon, Sun,
  Send, Paperclip, Check, CheckCheck, ArrowLeft, X, Plus,
} from 'lucide-react';

/* ── Profile Modal ───────────────────────────────────────── */
function ProfileModal({ user, onClose }: {
  user: { username: string; email: string; avatar?: string } | null;
  onClose: () => void;
}) {
  if (!user) return null;
  const initials = (user.username || 'U').slice(0, 2).toUpperCase();
  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.18s_ease]" onClick={onClose}>
      <div className="bg-[#16161f] border border-[#24243a] rounded-[20px] p-8 relative w-[90vw] max-w-sm text-center animate-[slideUp_0.22s_cubic-bezier(0.4,0,0.2,1)]" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#1e1e2e] border border-[#28283c] text-[#6868a0] flex items-center justify-center hover:bg-[#28283e] hover:text-[#d0d0f0] transition-all">
          <X size={16} />
        </button>
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6c3de5] to-[#3d8ef5] flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3.5 shadow-[0_6px_24px_rgba(108,61,229,0.4)]">
          {user.avatar || initials}
        </div>
        <h2 className="text-xl font-bold text-[#f0f0f8] mb-1">{user.username}</h2>
        <p className="text-sm text-[#5a5a88] mb-5">{user.email}</p>
        <div className="border-t border-[#1e1e2e] pt-2.5 flex flex-col gap-0">
          <div className="flex justify-between items-center py-2.5 border-b border-[#1e1e2e]">
            <span className="text-xs text-[#48487a] font-medium">Статус</span>
            <span className="text-sm text-[#c0c0e0] font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#3db87a] inline-block" />онлайн
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5">
            <span className="text-xs text-[#48487a] font-medium">ID</span>
            <span className="text-xs font-mono text-[#7070b8]">{user.username.toLowerCase().replace(/\s/g, '_')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Create Group Modal ──────────────────────────────────── */
function CreateGroupModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const handle = () => { if (name.trim()) { onCreate(name.trim()); onClose(); } };
  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.18s_ease]" onClick={onClose}>
      <div className="bg-[#16161f] border border-[#24243a] rounded-[20px] p-8 relative w-[90vw] max-w-sm animate-[slideUp_0.22s_cubic-bezier(0.4,0,0.2,1)]" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#1e1e2e] border border-[#28283c] text-[#6868a0] flex items-center justify-center hover:bg-[#28283e] hover:text-[#d0d0f0] transition-all">
          <X size={16} />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6c3de5] to-[#3d8ef5] flex items-center justify-center text-white mx-auto mb-4 shadow-[0_4px_16px_rgba(108,61,229,0.35)]">
          <UsersRound size={26} />
        </div>
        <h2 className="text-[19px] font-bold text-[#f0f0f8] text-center mb-1.5">Создать группу</h2>
        <p className="text-sm text-[#48487a] text-center mb-5">Введите название новой группы</p>
        <input
          ref={ref} type="text" placeholder="Название группы..." value={name}
          onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()}
          maxLength={50}
          className="w-full bg-[#1a1a2c] border border-[#28283c] rounded-xl px-3.5 py-3 text-sm text-[#d0d0ec] placeholder-[#34344e] outline-none mb-3.5 transition-all focus:border-[#4a6cf7] focus:shadow-[0_0_0_3px_rgba(74,108,247,0.12)]"
        />
        <button onClick={handle} disabled={!name.trim()}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${name.trim() ? 'bg-gradient-to-br from-[#4a6cf7] to-[#3a5ce5] text-white border border-[#4a6cf7] shadow-[0_4px_14px_rgba(74,108,247,0.35)] hover:-translate-y-px' : 'bg-[#1a1a2c] border border-[#28283c] text-[#3a3a6a] cursor-not-allowed'}`}>
          <Plus size={16} /> Создать группу
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */
export function ChatListPage() {
  const { chats, auth, logout, setCurrentChat, messages, sendMessage, markAsRead } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const filteredChats = chats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const chatMessages: MessageType[] = activeChatId ? (messages[activeChatId] || []) : [];

  useEffect(() => { if (activeChatId) markAsRead(activeChatId); }, [activeChatId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleChatClick = (chat: ChatType) => { setCurrentChat(chat); setActiveChatId(chat.id); };

  const handleSend = () => {
    if (messageText.trim() && activeChatId) {
      sendMessage(activeChatId, messageText.trim());
      setMessageText('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    const diff = Date.now() - date.getTime();
    const h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
    if (h < 1) return `${Math.floor(diff / 60000)}м`;
    if (h < 24) return `${h}ч`;
    if (d < 7) return `${d}д`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const fmtTime = (d: Date) => d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const fmtDate = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const MsgStatus = ({ msg }: { msg: MessageType }) => {
    if (msg.senderId !== 'me') return null;
    return msg.isRead
      ? <CheckCheck size={13} className="text-white/80" />
      : <Check size={13} className="text-white/50" />;
  };

  const activeChat = chats.find(c => c.id === activeChatId);
  const initials = (auth.user?.username || 'U').slice(0, 2).toUpperCase();

  // shared classes
  const navBtn = "flex items-center gap-3 px-[18px] py-[11px] text-[#8888b0] text-sm font-medium cursor-pointer transition-all duration-150 select-none hover:bg-[#1a1a28] hover:text-[#e0e0f8]";

  return (
    <>
      {showProfile && <ProfileModal user={auth.user} onClose={() => setShowProfile(false)} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} onCreate={n => alert(`Группа «${n}» будет создана после подключения бэкенда.`)} />}

      <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a10] p-3 gap-2.5">

        {/* ══ LEFT NAV PANEL ══ */}
        <aside className="w-[240px] min-w-[240px] bg-[#13131c] border border-[#1e1e2c] rounded-[20px] flex flex-col overflow-hidden flex-shrink-0">
          {/* User */}
          <div className="flex items-center gap-3 px-[18px] py-5 border-b border-[#1e1e2c] flex-shrink-0">
            <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#6c3de5] to-[#3d8ef5] flex items-center justify-center text-[18px] font-bold text-white flex-shrink-0 shadow-[0_4px_16px_rgba(108,61,229,0.4)]">
              {auth.user?.avatar || initials}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[15px] font-bold text-[#f0f0f8] truncate">{auth.user?.username}</span>
              <span className="text-[11.5px] text-[#5b8af5] cursor-pointer hover:text-[#7aa8ff] transition-colors">Установить статус</span>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto py-2 flex flex-col">
            <button onClick={() => setShowProfile(true)} className={navBtn}><User size={19} /><span>Мой профиль</span></button>
            <div className="h-px bg-[#1e1e2c] my-1" />
            <button onClick={() => setShowCreateGroup(true)} className={navBtn}><UsersRound size={19} /><span>Создать группу</span></button>
            <div className="h-px bg-[#1e1e2c] my-1" />
            <button onClick={() => navigate('/settings')} className={navBtn}><Settings size={19} /><span>Настройки</span></button>
            <button onClick={() => setDarkMode(v => !v)} className={navBtn}>
              {darkMode ? <Moon size={19} /> : <Sun size={19} />}
              <span>Ночной режим</span>
              <div className={`ml-auto w-9 h-5 rounded-full relative flex-shrink-0 transition-colors duration-250 ${darkMode ? 'bg-[#4a6cf7]' : 'bg-[#252535]'}`}>
                <div className={`absolute top-[3px] w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-250 ${darkMode ? 'translate-x-[19px]' : 'translate-x-[3px]'}`} />
              </div>
            </button>
            <button onClick={logout} className={`${navBtn} text-[#c05050] hover:bg-[rgba(192,80,80,0.1)] hover:text-[#e06060] mt-1`}>
              <LogOut size={19} /><span>Выйти</span>
            </button>
          </nav>
        </aside>

        {/* ══ CENTER CHAT VIEW ══ */}
        <main className="flex-1 bg-[#0f0f18] border border-[#1a1a28] rounded-[20px] flex flex-col overflow-hidden min-w-0">
          {!activeChatId ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="text-6xl opacity-[0.18] animate-[float_3.5s_ease-in-out_infinite]">💬</div>
              <h2 className="text-xl font-bold text-[#38385a]">Выберите чат</h2>
              <p className="text-sm text-[#28283e]">Выберите диалог справа, чтобы начать общение</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-[18px] py-3 bg-[#12121e] border-b border-[#1a1a28] flex-shrink-0">
                <button onClick={() => setActiveChatId(null)} className="hidden w-9 h-9 rounded-full bg-transparent text-[#5a5a88] items-center justify-center hover:bg-[#1e1e2e] hover:text-[#c0c0e0] transition-all">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6c3de5] to-[#3d8ef5] flex items-center justify-center text-lg text-white flex-shrink-0">
                  {activeChat?.avatar || <MessageCircle size={20} />}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold text-[#f0f0f8]">{activeChat?.name}</span>
                  <span className="text-[11.5px] font-medium text-[#3db87a]">онлайн</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-[18px] flex flex-col gap-1.5 bg-[#0f0f18]">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-5xl opacity-[0.18] mb-4">💬</div>
                    <p className="text-sm font-semibold text-[#38385a] mb-1">Здесь пока нет сообщений</p>
                    <p className="text-xs text-[#28283e]">Напишите первое сообщение!</p>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg, i) => {
                      const isMe = msg.senderId === 'me';
                      const showDate = i === 0 || new Date(msg.timestamp).toDateString() !== new Date(chatMessages[i - 1].timestamp).toDateString();
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-3">
                              <span className="bg-[#18182a] border border-[#24243a] text-[#50508a] text-[10.5px] font-semibold px-3 py-1 rounded-xl uppercase tracking-wider">
                                {fmtDate(msg.timestamp)}
                              </span>
                            </div>
                          )}
                          <div className={`flex max-w-[62%] animate-[msgPop_0.18s_ease-out] ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                            <div className={`px-3.5 py-2.5 rounded-2xl ${isMe ? 'bg-gradient-to-br from-[#4a6cf7] to-[#3a5ce5] text-white rounded-br-[4px] shadow-[0_3px_16px_rgba(74,108,247,0.28)]' : 'bg-[#1c1c2e] text-[#d0d0ec] border border-[#26263c] rounded-bl-[4px]'}`}>
                              <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                              <div className="flex items-center gap-1 mt-1 justify-end">
                                <span className={`text-[10.5px] font-medium ${isMe ? 'text-white/55' : 'text-[#484868]'}`}>{fmtTime(msg.timestamp)}</span>
                                <MsgStatus msg={msg} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input bar */}
              <div className="flex items-end gap-2.5 px-[18px] py-3 bg-[#12121e] border-t border-[#1a1a28] flex-shrink-0">
                <button className="w-10 h-10 rounded-full bg-[#1a1a2c] border border-[#24243a] text-[#50508a] flex items-center justify-center hover:bg-[#22223a] hover:text-[#8888c0] transition-all flex-shrink-0">
                  <Paperclip size={18} />
                </button>
                <div className="flex-1 bg-[#18182e] rounded-[18px] px-3.5 py-2.5 flex items-end border border-[#24243a] focus-within:border-[#4a6cf7] focus-within:shadow-[0_0_0_3px_rgba(74,108,247,0.1)] transition-all">
                  <textarea
                    ref={inputRef} placeholder="Написать сообщение..." value={messageText}
                    onChange={handleInput} onKeyDown={handleKeyDown} rows={1}
                    className="w-full bg-transparent resize-none max-h-[120px] text-sm leading-relaxed py-0.5 text-[#d0d0ec] placeholder-[#34344e] outline-none"
                  />
                </div>
                <button onClick={handleSend} disabled={!messageText.trim()}
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${messageText.trim() ? 'bg-gradient-to-br from-[#4a6cf7] to-[#3a5ce5] text-white border border-[#4a6cf7] shadow-[0_4px_14px_rgba(74,108,247,0.35)] hover:scale-[1.08]' : 'bg-[#1a1a2c] border border-[#24243a] text-[#38385a] cursor-not-allowed'}`}>
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </main>

        {/* ══ RIGHT CHAT LIST ══ */}
        <section className="w-[300px] min-w-[260px] bg-[#13131c] border border-[#1e1e2c] rounded-[20px] flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-[18px] py-5 border-b border-[#1e1e2c] flex-shrink-0">
            <span className="text-[19px] font-bold text-[#f0f0f8] tracking-tight">Сообщения</span>
          </div>

          <div className="relative px-3 py-2.5 flex-shrink-0">
            <Search size={15} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#40405e] pointer-events-none" />
            <input type="text" placeholder="Поиск" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#18182c] border border-[#22223a] rounded-xl py-2.5 pl-9 pr-3.5 text-[13.5px] text-[#d0d0ec] placeholder-[#38385a] outline-none transition-all focus:border-[#4a6cf7] focus:shadow-[0_0_0_3px_rgba(74,108,247,0.1)]"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-[#2e2e48] text-sm text-center">
                <MessageCircle size={32} className="opacity-20" />
                <p>Нет чатов</p>
              </div>
            )}
            {filteredChats.map(chat => (
              <div key={chat.id} onClick={() => handleChatClick(chat)}
                className={`relative flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors duration-150 after:absolute after:bottom-0 after:left-[66px] after:right-3.5 after:h-px after:bg-[#1a1a2a] ${activeChatId === chat.id ? 'bg-[#1a2240] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[#4a6cf7] before:rounded-r-sm' : 'hover:bg-[#18182a]'}`}>
                <div className="w-[46px] h-[46px] rounded-full bg-[#1e1e30] border border-[#28283c] flex items-center justify-center text-xl text-[#6868a0] flex-shrink-0">
                  {chat.avatar || (chat.isGroup ? <Users size={20} /> : <MessageCircle size={20} />)}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex justify-between items-center gap-1.5">
                    <span className="text-[14px] font-semibold text-[#e0e0f2] truncate">{chat.name}</span>
                    <span className="text-[10.5px] text-[#38385a] font-medium flex-shrink-0">{formatTime(chat.lastMessageTime)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-1.5">
                    <span className="text-[12.5px] text-[#48487a] truncate">{chat.lastMessage || 'Нет сообщений'}</span>
                    {chat.unreadCount > 0 && (
                      <span className="bg-[#4a6cf7] text-white text-[10.5px] font-bold px-1.5 py-0.5 rounded-[9px] min-w-[18px] text-center flex-shrink-0 shadow-[0_2px_8px_rgba(74,108,247,0.4)]">
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

      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes msgPop { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  );
}
