import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import {
  ArrowLeft, Sun, Moon, Check, Palette, Image, User,
  Upload, Trash2, Monitor, Copy, AtSign,
} from 'lucide-react';

const ACCENT_COLORS = [
  { color: '#ffffff', label: 'Default' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#8b5cf6', label: 'Purple' },
  { color: '#ef4444', label: 'Red' },
  { color: '#22c55e', label: 'Green' },
  { color: '#f59e0b', label: 'Amber' },
  { color: '#ec4899', label: 'Pink' },
  { color: '#06b6d4', label: 'Cyan' },
];

const BG_PRESETS = [
  { value: '', label: 'None' },
  { value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)', label: 'Night' },
  { value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', label: 'Deep' },
  { value: 'linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%)', label: 'Carbon' },
  { value: 'linear-gradient(135deg, #2d1b69 0%, #11001c 100%)', label: 'Cosmic' },
  { value: 'linear-gradient(135deg, #0c1821 0%, #1b2838 50%, #324a5f 100%)', label: 'Ocean' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { auth } = useApp();
  const { theme, toggleTheme, accentColor, setAccentColor, chatBackground, setChatBackground } = useTheme();
  const [customHex, setCustomHex] = useState('');
  const [activeSection, setActiveSection] = useState<'appearance' | 'chat' | 'profile'>('appearance');
  const [statusText, setStatusText] = useState('');
  const bgInputRef = useRef<HTMLInputElement>(null);

  const [newDisplayName, setNewDisplayName] = useState(auth.user?.displayName || '');
  const [newUsername, setNewUsername] = useState(auth.user?.username || '');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const updateUserMut = useMutation(api.users.updateUser);
  const updateStatusMut = useMutation(api.users.updateStatusText);
  const updateDisplayNameMut = useMutation(api.users.updateDisplayName);
  const updateUsernameMut = useMutation(api.users.updateUsername);

  const handleCustomHex = () => {
    const hex = customHex.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setAccentColor(hex);
      setCustomHex('');
    }
  };

  const handleBgUpload = async (file: File) => {
    try {
      const uploadUrl = await generateUploadUrl();
      const resp = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      const { storageId } = await resp.json() as { storageId: string };
      // Use storage URL as background
      const url = `${window.location.origin}/api/storage/${storageId}`;
      setChatBackground(`url(${url})`);
    } catch {
      // Fallback: use local data URL
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setChatBackground(`url(${reader.result})`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!auth.user?.id) return;
    try {
      const uploadUrl = await generateUploadUrl();
      const resp = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      const { storageId } = await resp.json() as { storageId: string };
      await updateUserMut({ userId: auth.user.id as Id<'users'>, username: auth.user.username, avatar: storageId, avatarType: 'image' });
    } catch (err) {
      console.error('Avatar upload error:', err);
    }
  };

  const initials = (auth.user?.displayName || auth.user?.username || 'U').slice(0, 2).toUpperCase();

  const handleSaveDisplayName = async () => {
    if (!auth.user?.id || !newDisplayName.trim()) return;
    await updateDisplayNameMut({ userId: auth.user.id as Id<'users'>, displayName: newDisplayName.trim() });
    const session = JSON.parse(localStorage.getItem('doppigram_session') || '{}');
    session.displayName = newDisplayName.trim();
    localStorage.setItem('doppigram_session', JSON.stringify(session));
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleSaveUsername = async () => {
    if (!auth.user?.id) return;
    const un = newUsername.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,20}$/.test(un)) {
      setUsernameError('3-20 chars, lowercase, numbers, underscores');
      return;
    }
    try {
      await updateUsernameMut({ userId: auth.user.id as Id<'users'>, newUsername: un });
      const session = JSON.parse(localStorage.getItem('doppigram_session') || '{}');
      session.username = un;
      localStorage.setItem('doppigram_session', JSON.stringify(session));
      setUsernameError('');
      setUsernameSaved(true);
      setTimeout(() => setUsernameSaved(false), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('USERNAME_TAKEN')) setUsernameError('This Doppi ID is already taken');
      else if (msg.includes('INVALID_USERNAME')) setUsernameError('Invalid format');
      else setUsernameError('Failed to update');
    }
  };

  const copyDoppId = () => {
    navigator.clipboard.writeText(`@${auth.user?.username || ''}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const sections = [
    { id: 'appearance' as const, label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'chat' as const, label: 'Chat Background', icon: <Image size={16} /> },
    { id: 'profile' as const, label: 'Profile', icon: <User size={16} /> },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      <header className="sticky top-0 z-40" style={{ backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--bg-border)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/chats')} className="p-2 rounded-xl transition-all active:scale-95 themed-border" style={{ backgroundColor: 'var(--bg-card)' }}>
            <ArrowLeft className="h-5 w-5" style={{ color: 'var(--tx-secondary)' }} />
          </button>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--tx-primary)' }}>Settings</h1>
            <p className="text-[11px] font-medium" style={{ color: 'var(--tx-muted)' }}>Customize your experience</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 animate-fadeInUp">
        {/* Section tabs */}
        <div className="flex gap-2 mb-8">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={activeSection === s.id
                ? { backgroundColor: 'var(--accent)', color: 'var(--msg-me-text)' }
                : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-secondary)' }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Appearance Section */}
        {activeSection === 'appearance' && (
          <div className="space-y-6">
            {/* Theme toggle */}
            <div className="rounded-2xl p-6 themed-border" style={{ backgroundColor: 'var(--bg-panel)' }}>
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Theme</h3>
              <div className="flex gap-3">
                <button onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                  className="flex-1 flex items-center gap-3 p-4 rounded-xl transition-all"
                  style={theme === 'dark'
                    ? { backgroundColor: 'var(--bg-active)', border: '2px solid var(--accent)' }
                    : { backgroundColor: 'var(--bg-card)', border: '2px solid var(--bg-border)' }}>
                  <Moon size={20} style={{ color: theme === 'dark' ? 'var(--accent)' : 'var(--tx-dim)' }} />
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: 'var(--tx-primary)' }}>Dark</p>
                    <p className="text-[11px]" style={{ color: 'var(--tx-muted)' }}>Black background</p>
                  </div>
                  {theme === 'dark' && <Check size={16} className="ml-auto" style={{ color: 'var(--accent)' }} />}
                </button>
                <button onClick={() => { if (theme !== 'light') toggleTheme(); }}
                  className="flex-1 flex items-center gap-3 p-4 rounded-xl transition-all"
                  style={theme === 'light'
                    ? { backgroundColor: 'var(--bg-active)', border: '2px solid var(--accent)' }
                    : { backgroundColor: 'var(--bg-card)', border: '2px solid var(--bg-border)' }}>
                  <Sun size={20} style={{ color: theme === 'light' ? 'var(--accent)' : 'var(--tx-dim)' }} />
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: 'var(--tx-primary)' }}>Light</p>
                    <p className="text-[11px]" style={{ color: 'var(--tx-muted)' }}>White background</p>
                  </div>
                  {theme === 'light' && <Check size={16} className="ml-auto" style={{ color: 'var(--accent)' }} />}
                </button>
              </div>
            </div>

            {/* Accent color */}
            <div className="rounded-2xl p-6 themed-border" style={{ backgroundColor: 'var(--bg-panel)' }}>
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Accent Color</h3>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {ACCENT_COLORS.map(c => (
                  <button key={c.color} onClick={() => setAccentColor(c.color)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                    style={accentColor === c.color
                      ? { backgroundColor: 'var(--bg-active)', border: '2px solid var(--accent)' }
                      : { backgroundColor: 'var(--bg-card)', border: '2px solid var(--bg-border)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: c.color === '#ffffff' ? (theme === 'dark' ? '#ffffff' : '#000000') : c.color }}>
                      {accentColor === c.color && <Check size={14} style={{ color: c.color === '#ffffff' ? (theme === 'dark' ? '#000000' : '#ffffff') : '#ffffff' }} />}
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--tx-muted)' }}>{c.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={customHex} onChange={e => setCustomHex(e.target.value)}
                  placeholder="#ff6600" maxLength={7}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm themed-border themed-border-focus"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} />
                <button onClick={handleCustomHex}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--msg-me-text)' }}>
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Background Section */}
        {activeSection === 'chat' && (
          <div className="space-y-6">
            <div className="rounded-2xl p-6 themed-border" style={{ backgroundColor: 'var(--bg-panel)' }}>
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Background Presets</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {BG_PRESETS.map(bg => (
                  <button key={bg.label} onClick={() => setChatBackground(bg.value)}
                    className="relative h-24 rounded-xl transition-all overflow-hidden"
                    style={{
                      background: bg.value || 'var(--bg-surface)',
                      border: chatBackground === bg.value ? '2px solid var(--accent)' : '2px solid var(--bg-border)',
                    }}>
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}>{bg.label}</span>
                    {chatBackground === bg.value && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                        <Check size={12} style={{ color: 'var(--msg-me-text)' }} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Custom Image</h3>
              <div className="flex gap-2">
                <button onClick={() => bgInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all themed-border"
                  style={{ backgroundColor: 'var(--bg-card)', color: 'var(--tx-secondary)' }}>
                  <Upload size={16} /> Upload Image
                </button>
                {chatBackground && (
                  <button onClick={() => setChatBackground('')}
                    className="px-4 py-3 rounded-xl text-sm font-semibold transition-all themed-border"
                    style={{ backgroundColor: 'var(--bg-card)', color: 'var(--danger)' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <input ref={bgInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleBgUpload(f); e.target.value = ''; }} />

              {/* Preview */}
              {chatBackground && (
                <div className="mt-4">
                  <p className="text-[10px] font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--tx-dim)' }}>Preview</p>
                  <div className="h-40 rounded-xl overflow-hidden flex items-end p-3 gap-2"
                    style={{ background: chatBackground, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--bg-border)' }}>
                    <div className="px-3 py-2 rounded-2xl rounded-bl-[4px] text-xs"
                      style={{ backgroundColor: 'var(--msg-other-bg)', border: '1px solid var(--msg-other-border)', color: 'var(--msg-other-text)' }}>
                      Hello there!
                    </div>
                    <div className="px-3 py-2 rounded-2xl rounded-br-[4px] text-xs msg-me ml-auto">
                      Hi! How are you?
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="space-y-6">
            <div className="rounded-2xl p-6 themed-border" style={{ backgroundColor: 'var(--bg-panel)' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative group">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--msg-me-text)' }}>
                    {initials}
                  </div>
                  <label className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <Upload size={16} className="text-white" />
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ''; }} />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold truncate" style={{ color: 'var(--tx-primary)' }}>{auth.user?.displayName || auth.user?.username}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs" style={{ color: 'var(--tx-muted)' }}>@{auth.user?.username}</p>
                    <button onClick={copyDoppId} className="p-0.5 rounded transition-all" title="Copy Doppi ID">
                      {copied ? <Check size={11} style={{ color: 'var(--online)' }} /> : <Copy size={11} style={{ color: 'var(--tx-dim)' }} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Display Name */}
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Display Name</label>
                  <div className="flex gap-2">
                    <input type="text" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)}
                      placeholder="Your name" maxLength={50}
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm themed-border themed-border-focus"
                      style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} />
                    <button onClick={handleSaveDisplayName}
                      className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--msg-me-text)' }}>
                      {nameSaved ? <Check size={15} /> : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Doppi ID */}
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Doppi ID</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--tx-dim)' }} />
                      <input type="text" value={newUsername} onChange={e => { setNewUsername(e.target.value.replace(/\s/g, '').toLowerCase()); setUsernameError(''); }}
                        placeholder="doppi_id" maxLength={20}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm themed-border themed-border-focus"
                        style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} />
                    </div>
                    <button onClick={handleSaveUsername}
                      className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--msg-me-text)' }}>
                      {usernameSaved ? <Check size={15} /> : 'Save'}
                    </button>
                  </div>
                  {usernameError && <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>{usernameError}</p>}
                  <p className="text-[10px] mt-1" style={{ color: 'var(--tx-dim)' }}>3-20 chars, lowercase, numbers, underscores</p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Status</label>
                  <div className="flex gap-2">
                    <input type="text" value={statusText} onChange={e => setStatusText(e.target.value)}
                      placeholder="What's on your mind?"
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm themed-border themed-border-focus"
                      style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }}
                      maxLength={100} />
                    <button onClick={() => { if (auth.user?.id) updateStatusMut({ userId: auth.user.id as Id<'users'>, statusText }); }}
                      className="px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--msg-me-text)' }}>
                      Save
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 flex justify-between items-center py-2.5 px-3 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
                    <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--tx-dim)' }}>Role</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--tx-primary)' }}>{auth.user?.isAdmin ? 'Admin' : 'User'}</span>
                  </div>
                  <div className="flex-1 flex justify-between items-center py-2.5 px-3 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
                    <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--tx-dim)' }}>Device</span>
                    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--tx-primary)' }}>
                      <Monitor size={12} /> {navigator.userAgent.includes('Mac') ? 'macOS' : navigator.userAgent.includes('Win') ? 'Windows' : 'Linux'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
