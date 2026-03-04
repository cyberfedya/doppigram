import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { useApp } from '../context/AppContext';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { MessageType } from '../types';
import { playMessageSound, playSendSound } from '../utils/sounds';
import {
  ArrowLeft, Send, Smile, Paperclip, Check, CheckCheck,
  Image, Video, Mic, X, StopCircle,
} from 'lucide-react';

const STICKERS = [
  '😀','😂','😍','🥰','😎','🤔','😮','😢','😡','😴',
  '🎉','❤️','💔','👍','👎','👋','🙏','💪','🔥','✨',
  '🎵','🎨','🐱','🐶','🦊','🐸','🐼','🦄','🌈','🌸',
  '🍕','🍦','🎮','🏆','💎','🚀','🌟','💯','🎁','🤝',
  '😈','👻','💀','🤖','👾','🎃','🌙','⭐','🌊','🍀',
];

interface ConvexMessage {
  _id: string; chatId: string; senderId: string; text: string;
  messageType?: MessageType; fileUrl?: string; isRead: boolean; createdAt: number;
}

interface ConvexChat {
  _id: string; name: string; avatar?: string; isGroup: boolean;
}

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { auth } = useApp();

  const chatId = id as Id<'chats'> | undefined;
  const currentUserId = auth.user?.id as Id<'users'> | undefined;

  const messages = useQuery(api.users.getMessagesForChat, chatId ? { chatId, limit: 100 } : 'skip') as ConvexMessage[] | undefined;
  const chatInfo = useQuery(api.users.getChatById, chatId ? { chatId } : 'skip') as ConvexChat | null | undefined;
  const typingUsers = useQuery(api.users.getTypingUsers, chatId && currentUserId ? { chatId, currentUserId } : 'skip') as string[] | undefined;
  const participantsStatus = useQuery(api.users.getChatParticipantsStatus, chatId && currentUserId ? { chatId, currentUserId } : 'skip') as Array<{ _id: string; username: string; isOnline: boolean; lastSeen: number }> | undefined;

  const sendMessageMut = useMutation(api.users.sendMessage);
  const markAsReadMut = useMutation(api.users.markMessagesAsRead);
  const setTypingMut = useMutation(api.users.setTyping);
  const clearTypingMut = useMutation(api.users.clearTyping);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [messageText, setMessageText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prevMsgCountRef = useRef<number>(0);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages?.length]);

  useEffect(() => {
    if (chatId && currentUserId) markAsReadMut({ chatId, userId: currentUserId }).catch(() => {});
  }, [chatId, currentUserId, messages?.length, markAsReadMut]);

  // Play notification sound on new incoming messages
  useEffect(() => {
    if (!messages) return;
    const count = messages.length;
    if (prevMsgCountRef.current > 0 && count > prevMsgCountRef.current) {
      const last = messages[count - 1];
      if (last && last.senderId !== currentUserId) playMessageSound();
    }
    prevMsgCountRef.current = count;
  }, [messages, currentUserId]);

  useEffect(() => {
    return () => {
      if (chatId && currentUserId) clearTypingMut({ chatId, userId: currentUserId }).catch(() => {});
      clearTimeout(typingTimeoutRef.current);
      clearInterval(recordingTimerRef.current);
    };
  }, [chatId, currentUserId, clearTypingMut]);

  const handleTypingStart = useCallback(() => {
    if (!chatId || !currentUserId || !auth.user?.username) return;
    setTypingMut({ chatId, userId: currentUserId, username: auth.user.username }).catch(() => {});
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { clearTypingMut({ chatId, userId: currentUserId }).catch(() => {}); }, 3000);
  }, [chatId, currentUserId, auth.user?.username, setTypingMut, clearTypingMut]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    handleTypingStart();
  };

  const handleSend = useCallback(async (text?: string, type: MessageType = 'text') => {
    const content = text ?? messageText.trim();
    if (!content || !chatId || !currentUserId) return;
    setMessageText('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    clearTimeout(typingTimeoutRef.current);
    clearTypingMut({ chatId, userId: currentUserId }).catch(() => {});
    playSendSound();
    await sendMessageMut({ chatId, senderId: currentUserId, text: content, messageType: type });
  }, [messageText, chatId, currentUserId, sendMessageMut, clearTypingMut]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    if (!chatId || !currentUserId) return;
    setIsUploading(true);
    setShowAttach(false);
    try {
      const uploadUrl = await generateUploadUrl();
      const resp = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      const { storageId } = await resp.json() as { storageId: string };
      await sendMessageMut({ chatId, senderId: currentUserId, text: type === 'image' ? '📷 Фото' : '🎥 Видео', messageType: type, storageId: storageId as Id<'_storage'> });
    } catch (err) { console.error('Upload error:', err); }
    finally { setIsUploading(false); }
  };

  const handleStartVideoMessage = async () => {
    if (!chatId || !currentUserId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordingTimerRef.current);
        setIsRecording(false); setRecordingTime(0); setIsUploading(true);
        try {
          const blob = new Blob(chunks, { type: chunks[0]?.type ?? 'video/webm' });
          const uploadUrl = await generateUploadUrl();
          const resp = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
          const { storageId } = await resp.json() as { storageId: string };
          await sendMessageMut({ chatId, senderId: currentUserId, text: '🎥 Видеосообщение', messageType: 'video_message', storageId: storageId as Id<'_storage'> });
        } catch (err) { console.error('Video message upload error:', err); }
        finally { setIsUploading(false); }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      let t = 0;
      recordingTimerRef.current = setInterval(() => { t += 1; setRecordingTime(t); if (t >= 60) recorder.stop(); }, 1000);
    } catch { alert('Нет доступа к камере или микрофону'); }
  };

  const handleStopVideoMessage = () => { mediaRecorderRef.current?.stop(); };

  const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const fmtDate = (ts: number) => {
    const days = Math.floor((Date.now() - ts) / 86400000);
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн. назад`;
    return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const renderMessageContent = (msg: ConvexMessage, isMe: boolean) => {
    const type = msg.messageType ?? 'text';
    if (type === 'sticker') return <span className="text-5xl leading-none select-none">{msg.text}</span>;
    if (type === 'image' && msg.fileUrl) {
      return (<div>
        <img src={msg.fileUrl} alt="фото" className="max-w-[240px] rounded-xl cursor-pointer border border-[#1a1a1a] hover:opacity-90 transition-opacity" onClick={() => window.open(msg.fileUrl, '_blank')} />
        {msg.text !== '📷 Фото' && <p className="text-sm mt-1.5 text-[#888]">{msg.text}</p>}
      </div>);
    }
    if (type === 'video' && msg.fileUrl) return <video src={msg.fileUrl} controls className="max-w-[240px] rounded-xl" />;
    if (type === 'video_message' && msg.fileUrl) return <video src={msg.fileUrl} controls playsInline className="w-32 h-32 rounded-full object-cover border-2 border-white/10" />;

    return (
      <div className={`px-3.5 py-2.5 rounded-2xl ${isMe ? 'bg-white text-black rounded-br-[4px]' : 'bg-[#111] text-[#ccc] border border-[#1a1a1a] rounded-bl-[4px]'}`}>
        <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
        <div className="flex items-center gap-1 mt-1 justify-end">
          <span className={`text-[10px] font-medium ${isMe ? 'text-black/40' : 'text-[#333]'}`}>{fmtTime(msg.createdAt)}</span>
          {isMe && (msg.isRead ? <CheckCheck size={13} className="text-black/50" /> : <Check size={13} className="text-black/30" />)}
        </div>
      </div>
    );
  };

  const chat = chatInfo ?? { name: 'Чат', avatar: '💬', isGroup: false };
  const typingText = typingUsers && typingUsers.length > 0 ? (typingUsers.length === 1 ? `${typingUsers[0]} печатает...` : `${typingUsers.length} человека печатают...`) : null;

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
    if (chat.isGroup) {
      const onlineCount = participantsStatus.filter(p => p.isOnline).length;
      return { text: `${participantsStatus.length + 1} уч., ${onlineCount} онлайн`, isOnline: onlineCount > 0 };
    }
    const other = participantsStatus[0];
    if (!other) return { text: '', isOnline: false };
    return other.isOnline ? { text: 'онлайн', isOnline: true } : { text: fmtLastSeen(other.lastSeen), isOnline: false };
  };

  const onlineStatus = getOnlineStatus();

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#080808] border-b border-[#151515] flex-shrink-0">
        <button onClick={() => navigate('/chats')} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/[0.05] transition-all active:scale-95">
          <ArrowLeft size={20} className="text-[#666]" />
        </button>
        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#222] flex items-center justify-center text-lg flex-shrink-0">
          {chat.avatar || '💬'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-white truncate">{chat.name}</div>
          <div className={`text-[11px] font-medium truncate ${typingText ? 'text-white animate-pulse-soft' : onlineStatus.isOnline ? 'text-[#4ade80]' : 'text-[#555]'}`}>
            {typingText ?? onlineStatus.text}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1.5 bg-[#060606]">
        {!messages ? (
          <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="text-4xl opacity-[0.06]">💬</div>
            <p className="text-sm text-[#333] font-semibold">Здесь пока нет сообщений</p>
            <p className="text-xs text-[#222]">Напишите первое сообщение!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.senderId === currentUserId;
              const type = msg.messageType ?? 'text';
              const isSticker = type === 'sticker';
              const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();
              return (
                <div key={msg._id} className="animate-msgPop">
                  {showDate && (
                    <div className="flex justify-center my-2">
                      <span className="bg-[#111] border border-[#1a1a1a] text-[#444] text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">{fmtDate(msg.createdAt)}</span>
                    </div>
                  )}
                  <div className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {isSticker ? (
                      <div className="flex flex-col items-end gap-0.5">
                        {renderMessageContent(msg, isMe)}
                        <span className="text-[9px] text-[#333] px-1">{fmtTime(msg.createdAt)}</span>
                      </div>
                    ) : (
                      <div className="max-w-[70%]">
                        {renderMessageContent(msg, isMe)}
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

      {/* Typing indicator */}
      {typingUsers && typingUsers.length > 0 && (
        <div className="px-4 pb-1 animate-fadeIn"><span className="text-xs text-[#555] italic">{typingText}</span></div>
      )}

      {/* Upload indicator */}
      {isUploading && (
        <div className="px-4 pb-1 flex items-center gap-2 animate-fadeIn">
          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-xs text-[#555]">Загрузка файла...</span>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="px-4 py-2 bg-[#0a0505] border-t border-[#1a1010] flex items-center gap-3 animate-fadeIn">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff4444] animate-pulse" />
          <span className="text-sm text-[#ff6b6b] font-medium">Запись... {recordingTime}с</span>
          <button onClick={handleStopVideoMessage} className="ml-auto px-3 py-1.5 bg-white/[0.05] text-[#ff6b6b] rounded-lg text-sm flex items-center gap-1 hover:bg-white/10 transition-all active:scale-95">
            <StopCircle size={14} /> Стоп
          </button>
        </div>
      )}

      {/* Sticker picker */}
      {showStickers && (
        <div className="bg-[#080808] border-t border-[#151515] p-3 animate-slideDown">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#444] font-semibold uppercase tracking-wider">Стикеры</span>
            <button onClick={() => setShowStickers(false)} className="text-[#444] hover:text-white transition-colors"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-10 gap-0.5 max-h-32 overflow-y-auto">
            {STICKERS.map((s) => (
              <button key={s} onClick={() => { handleSend(s, 'sticker'); setShowStickers(false); }}
                className="text-2xl p-1.5 rounded-lg hover:bg-white/[0.05] transition-all active:scale-90">{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Attach menu */}
      {showAttach && (
        <div className="bg-[#080808] border-t border-[#151515] p-3 flex gap-2 animate-slideDown">
          <button onClick={() => { imageInputRef.current?.click(); setShowAttach(false); }}
            className="flex flex-col items-center gap-1.5 px-5 py-3 bg-[#111] border border-[#1a1a1a] rounded-xl hover:bg-[#1a1a1a] transition-all active:scale-95">
            <Image size={20} className="text-[#888]" /><span className="text-[10px] text-[#555] font-medium">Фото</span>
          </button>
          <button onClick={() => { videoInputRef.current?.click(); setShowAttach(false); }}
            className="flex flex-col items-center gap-1.5 px-5 py-3 bg-[#111] border border-[#1a1a1a] rounded-xl hover:bg-[#1a1a1a] transition-all active:scale-95">
            <Video size={20} className="text-[#888]" /><span className="text-[10px] text-[#555] font-medium">Видео</span>
          </button>
          {!isRecording && (
            <button onClick={() => { handleStartVideoMessage(); setShowAttach(false); }}
              className="flex flex-col items-center gap-1.5 px-5 py-3 bg-[#111] border border-[#1a1a1a] rounded-xl hover:bg-[#1a1a1a] transition-all active:scale-95">
              <Mic size={20} className="text-[#888]" /><span className="text-[10px] text-[#555] font-medium">Кружок</span>
            </button>
          )}
          <button onClick={() => setShowAttach(false)} className="ml-auto self-center p-2 text-[#444] hover:text-white transition-colors"><X size={16} /></button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'image'); e.target.value = ''; }} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'video'); e.target.value = ''; }} />

      {/* Input bar */}
      <div className="flex items-end gap-2 px-3 py-3 bg-[#080808] border-t border-[#151515] flex-shrink-0">
        <button onClick={() => { setShowStickers(v => !v); setShowAttach(false); }}
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${showStickers ? 'bg-white text-black' : 'bg-[#111] text-[#444] hover:text-white hover:bg-[#1a1a1a]'}`}>
          <Smile size={18} />
        </button>
        <button onClick={() => { setShowAttach(v => !v); setShowStickers(false); }}
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${showAttach ? 'bg-white text-black' : 'bg-[#111] text-[#444] hover:text-white hover:bg-[#1a1a1a]'}`}>
          <Paperclip size={18} />
        </button>
        <div className="flex-1 bg-[#111] rounded-2xl px-3.5 py-2.5 border border-[#1a1a1a] focus-within:border-[#333] transition-all">
          <textarea ref={inputRef} placeholder="Сообщение..." value={messageText} onChange={handleInput} onKeyDown={handleKeyDown} rows={1}
            className="w-full bg-transparent resize-none max-h-[120px] text-sm leading-relaxed py-0.5 text-white placeholder-[#333] outline-none" />
        </div>
        <button onClick={() => handleSend()} disabled={!messageText.trim() || isUploading}
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${messageText.trim() ? 'bg-white text-black hover:scale-105 active:scale-90' : 'bg-[#111] text-[#333] cursor-not-allowed'}`}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
