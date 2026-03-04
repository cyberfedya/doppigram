import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { MessageType } from '../types';
import { playMessageSound, playSendSound } from '../utils/sounds';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { TypingIndicator } from '../components/TypingIndicator';
import {
  ArrowLeft, Send, Smile, Paperclip, Check, CheckCheck,
  Image, Video, Mic, X, StopCircle, Sun, Moon, User, Users,
  MessageSquare, Reply, CornerDownRight, Search, Pin,
} from 'lucide-react';
import { ReactionPicker, REACTION_ICONS } from '../components/ReactionPicker';

const STICKERS = [
  '😀','😂','😍','🥰','😎','🤔','😮','😢','😡','😴',
  '🎉','❤️','💔','👍','👎','👋','🙏','💪','🔥','✨',
  '🎵','🎨','🐱','🐶','🦊','🐸','🐼','🦄','🌈','🌸',
  '🍕','🍦','🎮','🏆','💎','🚀','🌟','💯','🎁','🤝',
  '😈','👻','💀','🤖','👾','🎃','🌙','⭐','🌊','🍀',
];

interface ReplyTo {
  _id: string;
  text: string;
  senderName: string;
  messageType: string;
}

interface ConvexMessage {
  _id: string; chatId: string; senderId: string; text: string;
  messageType?: MessageType; fileUrl?: string; replyToId?: string;
  replyTo?: ReplyTo | null; isPinned?: boolean; isRead: boolean; createdAt: number;
}

interface ConvexChat {
  _id: string; name: string; avatar?: string; isGroup: boolean;
}

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { auth } = useApp();
  const { theme, toggleTheme, chatBackground } = useTheme();

  const chatId = id as Id<'chats'> | undefined;
  const currentUserId = auth.user?.id as Id<'users'> | undefined;

  const messages = useQuery(api.users.getMessagesForChat, chatId ? { chatId, limit: 100 } : 'skip') as ConvexMessage[] | undefined;
  const chatInfo = useQuery(api.users.getChatById, chatId ? { chatId } : 'skip') as ConvexChat | null | undefined;
  const typingUsers = useQuery(api.users.getTypingUsers, chatId && currentUserId ? { chatId, currentUserId } : 'skip') as string[] | undefined;
  const participantsStatus = useQuery(api.users.getChatParticipantsStatus, chatId && currentUserId ? { chatId, currentUserId } : 'skip') as Array<{ _id: string; username: string; displayName?: string; isOnline: boolean; lastSeen: number; isVerified: boolean }> | undefined;

  const messageIds = (messages ?? []).map(m => m._id as Id<'messages'>);
  const reactions = useQuery(api.reactions.getReactionsForMessages, messageIds.length > 0 ? { messageIds } : 'skip') as Record<string, Array<{ reaction: string; userId: string; username: string }>> | undefined;

  const pinnedMessages = useQuery(api.users.getPinnedMessages, chatId ? { chatId } : 'skip') as ConvexMessage[] | undefined;

  const sendMessageMut = useMutation(api.users.sendMessage);
  const markAsReadMut = useMutation(api.users.markMessagesAsRead);
  const setTypingMut = useMutation(api.users.setTyping);
  const clearTypingMut = useMutation(api.users.clearTyping);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const toggleReactionMut = useMutation(api.reactions.toggleReaction);
  const togglePinMut = useMutation(api.users.togglePinMessage);

  const [messageText, setMessageText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ConvexMessage | null>(null);

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
    const replyId = replyingTo?._id as Id<'messages'> | undefined;
    setMessageText('');
    setReplyingTo(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';
    clearTimeout(typingTimeoutRef.current);
    clearTypingMut({ chatId, userId: currentUserId }).catch(() => {});
    playSendSound();
    await sendMessageMut({ chatId, senderId: currentUserId, text: content, messageType: type, replyToId: replyId });
  }, [messageText, chatId, currentUserId, sendMessageMut, clearTypingMut, replyingTo]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    if (!chatId || !currentUserId) return;
    setIsUploading(true);
    setShowAttach(false);
    try {
      const uploadUrl = await generateUploadUrl();
      const resp = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      const { storageId } = await resp.json() as { storageId: string };
      await sendMessageMut({ chatId, senderId: currentUserId, text: type === 'image' ? 'Photo' : 'Video', messageType: type, storageId: storageId as Id<'_storage'> });
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
          await sendMessageMut({ chatId, senderId: currentUserId, text: 'Video message', messageType: 'video_message', storageId: storageId as Id<'_storage'> });
        } catch (err) { console.error('Video message upload error:', err); }
        finally { setIsUploading(false); }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      let t = 0;
      recordingTimerRef.current = setInterval(() => { t += 1; setRecordingTime(t); if (t >= 60) recorder.stop(); }, 1000);
    } catch { alert('No camera or microphone access'); }
  };

  const handleStopVideoMessage = () => { mediaRecorderRef.current?.stop(); };

  const handleStartVoiceMessage = async () => {
    if (!chatId || !currentUserId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordingTimerRef.current);
        setIsVoiceRecording(false); setRecordingTime(0); setIsUploading(true);
        try {
          const blob = new Blob(chunks, { type: chunks[0]?.type ?? mimeType });
          const uploadUrl = await generateUploadUrl();
          const resp = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
          const { storageId } = await resp.json() as { storageId: string };
          await sendMessageMut({ chatId, senderId: currentUserId, text: 'Voice message', messageType: 'voice', storageId: storageId as Id<'_storage'> });
        } catch (err) { console.error('Voice upload error:', err); }
        finally { setIsUploading(false); }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsVoiceRecording(true);
      let t = 0;
      recordingTimerRef.current = setInterval(() => { t += 1; setRecordingTime(t); if (t >= 120) recorder.stop(); }, 1000);
    } catch { alert('No microphone access'); }
  };

  const handleStopVoiceMessage = () => { mediaRecorderRef.current?.stop(); };

  const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const fmtDate = (ts: number) => {
    const days = Math.floor((Date.now() - ts) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(ts).toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
  };

  const ReplySnippet = ({ reply, isMe }: { reply: ReplyTo; isMe: boolean }) => (
    <div className="mb-1.5 px-2.5 py-1.5 rounded-lg text-[11px] border-l-2"
      style={{ borderColor: 'var(--accent)', backgroundColor: isMe ? 'rgba(0,0,0,0.1)' : 'var(--bg-hover)' }}>
      <span className="font-semibold block" style={{ color: isMe ? 'inherit' : 'var(--accent)', opacity: isMe ? 0.7 : 1 }}>{reply.senderName}</span>
      <span className="truncate block" style={{ opacity: 0.7 }}>
        {reply.messageType === 'image' ? 'Photo' : reply.messageType === 'video' ? 'Video' : reply.text}
      </span>
    </div>
  );

  const renderMessageContent = (msg: ConvexMessage, isMe: boolean) => {
    const type = msg.messageType ?? 'text';
    if (type === 'sticker') return <span className="text-5xl leading-none select-none">{msg.text}</span>;
    if (type === 'image' && msg.fileUrl) {
      return (<div>
        {msg.replyTo && <ReplySnippet reply={msg.replyTo} isMe={isMe} />}
        <img src={msg.fileUrl} alt="photo" className="max-w-[240px] rounded-xl cursor-pointer transition-opacity hover:opacity-90" style={{ border: '1px solid var(--bg-border)' }} onClick={() => window.open(msg.fileUrl, '_blank')} />
        {msg.text !== 'Photo' && <p className="text-sm mt-1.5" style={{ color: 'var(--tx-secondary)' }}>{msg.text}</p>}
      </div>);
    }
    if (type === 'video' && msg.fileUrl) return <video src={msg.fileUrl} controls className="max-w-[240px] rounded-xl" />;
    if (type === 'video_message' && msg.fileUrl) return <video src={msg.fileUrl} controls playsInline className="w-32 h-32 rounded-full object-cover" style={{ border: '2px solid var(--bg-border)' }} />;
    if (type === 'voice' && msg.fileUrl) return (
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ backgroundColor: isMe ? undefined : 'var(--msg-other-bg)', border: isMe ? 'none' : '1px solid var(--msg-other-border)', minWidth: 200 }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--msg-me-bg)' }}>
          <Mic size={14} style={{ color: 'var(--msg-me-text)' }} />
        </div>
        <audio controls src={msg.fileUrl} className="flex-1" style={{ height: 32, minWidth: 0 }} />
      </div>
    );

    return (
      <div className={`px-3.5 py-2.5 rounded-xl ${isMe ? 'msg-me rounded-br-[4px]' : 'rounded-bl-[4px]'}`}
        style={!isMe ? { backgroundColor: 'var(--msg-other-bg)', border: '1px solid var(--msg-other-border)', color: 'var(--msg-other-text)' } : undefined}>
        {msg.replyTo && <ReplySnippet reply={msg.replyTo} isMe={isMe} />}
        <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
        <div className="flex items-center gap-1 mt-1 justify-end">
          <span className="text-[10px] font-medium" style={{ opacity: 0.5 }}>{fmtTime(msg.createdAt)}</span>
          {isMe && (msg.isRead ? <CheckCheck size={13} style={{ opacity: 0.6 }} /> : <Check size={13} style={{ opacity: 0.4 }} />)}
        </div>
      </div>
    );
  };

  const chatRaw = chatInfo ?? { name: 'Chat', avatar: undefined, isGroup: false };
  const otherUser = !chatRaw.isGroup && participantsStatus && participantsStatus.length > 0 ? participantsStatus[0] : null;
  const chat = { ...chatRaw, name: otherUser ? ((otherUser as any).displayName || otherUser.username) : chatRaw.name, isVerified: otherUser?.isVerified ?? false };
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
    if (chat.isGroup) {
      const onlineCount = participantsStatus.filter(p => p.isOnline).length;
      return { text: `${participantsStatus.length + 1} members, ${onlineCount} online`, isOnline: onlineCount > 0 };
    }
    const other = participantsStatus[0];
    if (!other) return { text: '', isOnline: false };
    return other.isOnline ? { text: 'online', isOnline: true } : { text: fmtLastSeen(other.lastSeen), isOnline: false };
  };

  const onlineStatus = getOnlineStatus();

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--tx-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--bg-border)' }}>
        <button onClick={() => navigate('/chats')} className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ color: 'var(--tx-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
          {chat.isGroup ? <Users size={18} style={{ color: 'var(--accent-secondary)' }} /> : <User size={18} style={{ color: 'var(--accent)' }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="text-[14px] font-bold truncate" style={{ color: 'var(--tx-primary)' }}>{chat.name}</div>
            {chat.isVerified && <VerifiedBadge size={14} />}
          </div>
          <div className="text-[11px] font-medium truncate"
            style={{ color: typingNames.length > 0 ? 'var(--accent)' : onlineStatus.isOnline ? 'var(--online)' : 'var(--tx-muted)' }}>
            {typingNames.length > 0 ? <TypingIndicator names={typingNames} /> : onlineStatus.text}
          </div>
        </div>
        <button onClick={() => setShowSearch(v => !v)} className="p-2 rounded-lg transition-all" style={{ color: showSearch ? 'var(--accent)' : 'var(--tx-dim)' }}>
          <Search size={16} />
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-lg transition-all" style={{ color: 'var(--tx-dim)' }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 flex items-center gap-2 animate-slideDown" style={{ backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--bg-border)' }}>
          <Search size={14} style={{ color: 'var(--tx-dim)' }} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search in chat..." autoFocus
            className="flex-1 bg-transparent text-sm" style={{ color: 'var(--tx-primary)' }} />
          <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} style={{ color: 'var(--tx-dim)' }}><X size={14} /></button>
        </div>
      )}

      {/* Pinned message banner */}
      {pinnedMessages && pinnedMessages.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--bg-border)' }}>
          <Pin size={13} style={{ color: 'var(--accent)' }} />
          <p className="flex-1 text-xs truncate" style={{ color: 'var(--tx-secondary)' }}>
            {pinnedMessages[pinnedMessages.length - 1].text}
          </p>
          <span className="text-[10px] font-medium" style={{ color: 'var(--tx-dim)' }}>Pinned</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1.5" style={{ backgroundColor: 'var(--bg-surface)', background: chatBackground || undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {!messages ? (
          <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--bg-border)', borderTopColor: 'var(--accent)' }} /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <MessageSquare size={32} className="opacity-[0.08]" style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--tx-dim)' }}>No messages here yet</p>
            <p className="text-xs" style={{ color: 'var(--tx-ghost)' }}>Write the first message!</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.senderId === currentUserId;
              const type = msg.messageType ?? 'text';
              const isSticker = type === 'sticker';
              const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();
              const isSearchMatch = searchQuery && msg.text.toLowerCase().includes(searchQuery.toLowerCase());
              return (
                <div key={msg._id} className="animate-msgPop" style={isSearchMatch ? { backgroundColor: 'var(--selection-bg)', borderRadius: '12px', padding: '2px' } : undefined}>
                  {showDate && (
                    <div className="flex justify-center my-2">
                      <span className="text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider"
                        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-muted)' }}>{fmtDate(msg.createdAt)}</span>
                    </div>
                  )}
                  <div className={`w-full flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`flex ${isMe ? 'flex-row' : 'flex-row'} group/msg items-center`}>
                      {isMe && !isSticker && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity mr-1">
                          <button onClick={() => { if (currentUserId) togglePinMut({ messageId: msg._id as Id<'messages'>, userId: currentUserId }); }}
                            className="p-1 rounded-full" style={{ color: msg.isPinned ? 'var(--accent)' : 'var(--tx-dim)' }} title={msg.isPinned ? 'Unpin' : 'Pin'}>
                            <Pin size={12} />
                          </button>
                          <button onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }}
                            className="p-1 rounded-full" style={{ color: 'var(--tx-dim)' }} title="Reply">
                            <Reply size={14} />
                          </button>
                        </div>
                      )}
                      <div className={isSticker ? '' : 'max-w-[70%]'}
                        onDoubleClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg._id ? null : msg._id)}>
                        {isSticker ? (
                          <div className="flex flex-col items-end gap-0.5">
                            {renderMessageContent(msg, isMe)}
                            <span className="text-[9px] px-1" style={{ color: 'var(--tx-dim)' }}>{fmtTime(msg.createdAt)}</span>
                          </div>
                        ) : renderMessageContent(msg, isMe)}
                      </div>
                      {!isMe && !isSticker && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity ml-1">
                          <button onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }}
                            className="p-1 rounded-full" style={{ color: 'var(--tx-dim)' }} title="Reply">
                            <Reply size={14} />
                          </button>
                          <button onClick={() => { if (currentUserId) togglePinMut({ messageId: msg._id as Id<'messages'>, userId: currentUserId }); }}
                            className="p-1 rounded-full" style={{ color: msg.isPinned ? 'var(--accent)' : 'var(--tx-dim)' }} title="Pin">
                            <Pin size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Reaction picker */}
                    {reactionPickerMsgId === msg._id && (
                      <div className={`mt-1 ${isMe ? 'mr-2' : 'ml-2'}`}>
                        <ReactionPicker onSelect={(r) => {
                          if (currentUserId) toggleReactionMut({ messageId: msg._id as Id<'messages'>, userId: currentUserId, reaction: r });
                          setReactionPickerMsgId(null);
                        }} />
                      </div>
                    )}
                    {/* Reaction pills */}
                    {reactions?.[msg._id] && reactions[msg._id].length > 0 && (
                      <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'mr-2' : 'ml-2'}`}>
                        {Object.entries(
                          reactions[msg._id].reduce<Record<string, number>>((acc, r) => { acc[r.reaction] = (acc[r.reaction] || 0) + 1; return acc; }, {})
                        ).map(([reaction, count]) => (
                          <button key={reaction}
                            onClick={() => { if (currentUserId) toggleReactionMut({ messageId: msg._id as Id<'messages'>, userId: currentUserId, reaction }); }}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all"
                            style={{
                              backgroundColor: reactions[msg._id].some(r => r.reaction === reaction && r.userId === currentUserId) ? 'var(--bg-active)' : 'var(--bg-card)',
                              border: '1px solid var(--bg-border)',
                              color: 'var(--tx-secondary)',
                            }}>
                            {REACTION_ICONS[reaction]} {count > 1 && count}
                          </button>
                        ))}
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
      {typingNames.length > 0 && (
        <div className="px-4 pb-1 animate-fadeIn"><TypingIndicator names={typingNames} /></div>
      )}

      {/* Upload indicator */}
      {isUploading && (
        <div className="px-4 pb-1 flex items-center gap-2 animate-fadeIn">
          <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--bg-border)', borderTopColor: 'var(--accent)' }} />
          <span className="text-xs" style={{ color: 'var(--tx-muted)' }}>Uploading file...</span>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="px-4 py-2 flex items-center gap-3 animate-fadeIn" style={{ backgroundColor: 'var(--bg-panel)', borderTop: '1px solid var(--bg-border)' }}>
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--danger)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>Recording video... {recordingTime}s</span>
          <button onClick={handleStopVideoMessage} className="ml-auto px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all active:scale-95"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--danger)' }}>
            <StopCircle size={14} /> Stop
          </button>
        </div>
      )}

      {/* Sticker picker */}
      {showStickers && (
        <div className="p-3 animate-slideDown" style={{ backgroundColor: 'var(--bg-panel)', borderTop: '1px solid var(--bg-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Stickers</span>
            <button onClick={() => setShowStickers(false)} style={{ color: 'var(--tx-muted)' }}><X size={14} /></button>
          </div>
          <div className="grid grid-cols-10 gap-0.5 max-h-32 overflow-y-auto">
            {STICKERS.map((s) => (
              <button key={s} onClick={() => { handleSend(s, 'sticker'); setShowStickers(false); }}
                className="text-2xl p-1.5 rounded-lg transition-all active:scale-90"
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Attach menu */}
      {showAttach && (
        <div className="p-3 flex gap-2 animate-slideDown" style={{ backgroundColor: 'var(--bg-panel)', borderTop: '1px solid var(--bg-border)' }}>
          <button onClick={() => { imageInputRef.current?.click(); setShowAttach(false); }}
            className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl transition-all active:scale-95 themed-border"
            style={{ backgroundColor: 'var(--bg-card)' }}>
            <Image size={20} style={{ color: 'var(--accent)' }} /><span className="text-[10px] font-medium" style={{ color: 'var(--tx-muted)' }}>Photo</span>
          </button>
          <button onClick={() => { videoInputRef.current?.click(); setShowAttach(false); }}
            className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl transition-all active:scale-95 themed-border"
            style={{ backgroundColor: 'var(--bg-card)' }}>
            <Video size={20} style={{ color: 'var(--accent-secondary)' }} /><span className="text-[10px] font-medium" style={{ color: 'var(--tx-muted)' }}>Video</span>
          </button>
          {!isRecording && (
            <button onClick={() => { handleStartVideoMessage(); setShowAttach(false); }}
              className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl transition-all active:scale-95 themed-border"
              style={{ backgroundColor: 'var(--bg-card)' }}>
              <Mic size={20} style={{ color: 'var(--accent-secondary)' }} /><span className="text-[10px] font-medium" style={{ color: 'var(--tx-muted)' }}>Circle</span>
            </button>
          )}
          <button onClick={() => setShowAttach(false)} className="ml-auto self-center p-2 transition-colors" style={{ color: 'var(--tx-muted)' }}><X size={16} /></button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'image'); e.target.value = ''; }} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'video'); e.target.value = ''; }} />

      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 py-2 animate-slideDown" style={{ backgroundColor: 'var(--bg-panel)', borderTop: '1px solid var(--bg-border)' }}>
          <CornerDownRight size={14} style={{ color: 'var(--accent)' }} />
          <div className="flex-1 min-w-0 border-l-2 pl-2 py-0.5" style={{ borderColor: 'var(--accent)' }}>
            <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--accent)' }}>
              {replyingTo.senderId === currentUserId ? 'You' : 'Message'}
            </p>
            <p className="text-[11px] truncate" style={{ color: 'var(--tx-muted)' }}>
              {replyingTo.messageType === 'image' ? 'Photo' : replyingTo.messageType === 'video' ? 'Video' : replyingTo.text}
            </p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full" style={{ color: 'var(--tx-dim)' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-2 px-3 py-3 flex-shrink-0" style={{ backgroundColor: 'var(--bg-panel)', borderTop: replyingTo ? 'none' : '1px solid var(--bg-border)' }}>
        <button onClick={() => { setShowStickers(v => !v); setShowAttach(false); }}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={showStickers ? { background: 'var(--msg-me-bg)', color: 'var(--msg-me-text)' } : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-muted)' }}>
          <Smile size={18} />
        </button>
        <button onClick={() => { setShowAttach(v => !v); setShowStickers(false); }}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={showAttach ? { background: 'var(--msg-me-bg)', color: 'var(--msg-me-text)' } : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-muted)' }}>
          <Paperclip size={18} />
        </button>
        <div className="flex-1 rounded-lg px-3 py-2 themed-border themed-border-focus" style={{ backgroundColor: 'var(--bg-input)' }}>
          {isVoiceRecording ? (
            <div className="flex items-center gap-2 py-0.5">
              <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: 'var(--danger)' }} />
              <span className="text-sm" style={{ color: 'var(--danger)' }}>Recording {recordingTime}s</span>
            </div>
          ) : (
            <textarea ref={inputRef} placeholder="Message..." value={messageText} onChange={handleInput} onKeyDown={handleKeyDown} rows={1}
              className="w-full bg-transparent resize-none max-h-[120px] text-sm leading-relaxed py-0.5"
              style={{ color: 'var(--tx-primary)' }} />
          )}
        </div>
        {isVoiceRecording ? (
          <button onClick={handleStopVoiceMessage}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 animate-pulse"
            style={{ backgroundColor: 'var(--danger)', color: '#fff' }}>
            <StopCircle size={18} />
          </button>
        ) : messageText.trim() ? (
          <button onClick={() => handleSend()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90"
            style={{ background: 'var(--msg-me-bg)', color: 'var(--msg-me-text)' }}>
            <Send size={17} />
          </button>
        ) : (
          <button onClick={handleStartVoiceMessage} disabled={isRecording || isUploading}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-muted)' }}>
            <Mic size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
