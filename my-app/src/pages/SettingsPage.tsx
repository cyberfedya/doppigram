import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowLeft, Sun, Moon, Check, Palette, Image, User,
  Upload, Trash2, Monitor, Copy, AtSign,
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _noop = async (..._: unknown[]): Promise<any> => { throw new Error('Backend not configured'); };

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

  // TODO: replace with your backend mutations
  const generateUploadUrl = _noop;
  const updateUserMut = _noop;
  const updateStatusMut = _noop;
  const updateDisplayNameMut = _noop;
  const updateUsernameMut = _noop;

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
      await updateUserMut({ userId: auth.user.id, username: auth.user.username, avatar: storageId, avatarType: 'image' });
    } catch (err) {
      console.error('Avatar upload error:', err);
    }
  };

  const initials = (auth.user?.displayName || auth.user?.username || 'U').slice(0, 2).toUpperCase();

  const handleSaveDisplayName = async () => {
    if (!auth.user?.id || !newDisplayName.trim()) return;
    try {
      await updateDisplayNameMut({ userId: auth.user.id, displayName: newDisplayName.trim() });
      const session = JSON.parse(localStorage.getItem('doppigram_session') || '{}');
      session.displayName = newDisplayName.trim();
      localStorage.setItem('doppigram_session', JSON.stringify(session));
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch (err) {
      console.error('Save display name error:', err);
    }
  };

  const handleSaveUsername = async () => {
    if (!auth.user?.id) return;
    const un = newUsername.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,20}$/.test(un)) {
      setUsernameError('3-20 chars, lowercase, numbers, underscores');
      return;
    }
    try {
      await updateUsernameMut({ userId: auth.user.id, newUsername: un });
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-panel)' }}>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate('/chats')}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ border: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-card)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}>
            <ArrowLeft size={15} style={{ color: 'var(--tx-secondary)' }} />
          </button>
          <span className="text-[14px] font-semibold" style={{ color: 'var(--tx-primary)' }}>Settings</span>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-4xl mx-auto w-full px-6 py-8 flex gap-7">
        {/* Sidebar nav */}
        <aside className="w-[170px] flex-shrink-0">
          <nav className="flex flex-col gap-0.5">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left w-full"
                style={activeSection === s.id
                  ? { backgroundColor: 'var(--bg-active)', color: 'var(--tx-primary)' }
                  : { color: 'var(--tx-secondary)' }}
                onMouseEnter={e => { if (activeSection !== s.id) { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--tx-primary)'; } }}
                onMouseLeave={e => { if (activeSection !== s.id) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--tx-secondary)'; } }}>
                <span style={{ opacity: 0.6 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 animate-fadeIn">

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div className="space-y-5">
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--tx-muted)' }}>Theme</p>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-panel)' }}>
                  {[
                    { id: 'dark' as const, icon: <Moon size={15} />, label: 'Dark' },
                    { id: 'light' as const, icon: <Sun size={15} />, label: 'Light' },
                  ].map((t, i) => (
                    <button key={t.id} onClick={() => { if (theme !== t.id) toggleTheme(); }}
                      className="flex items-center gap-3 px-4 py-3.5 w-full text-left transition-colors"
                      style={{ borderTop: i > 0 ? '1px solid var(--bg-border)' : 'none', backgroundColor: theme === t.id ? 'var(--bg-hover)' : 'transparent' }}
                      onMouseEnter={e => { if (theme !== t.id) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { if (theme !== t.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <span style={{ color: 'var(--tx-secondary)', opacity: 0.7 }}>{t.icon}</span>
                      <span className="flex-1 text-[13px] font-medium" style={{ color: 'var(--tx-primary)' }}>{t.label}</span>
                      {theme === t.id && <Check size={14} style={{ color: 'var(--accent)' }} />}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--tx-muted)' }}>Accent Color</p>
                <div className="rounded-xl p-4" style={{ border: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-panel)' }}>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {ACCENT_COLORS.map(c => (
                      <button key={c.color} onClick={() => setAccentColor(c.color)}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-colors"
                        style={accentColor === c.color
                          ? { backgroundColor: 'var(--bg-active)', border: '1px solid var(--accent)' }
                          : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
                        <div className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: c.color === '#ffffff' ? (theme === 'dark' ? '#ffffff' : '#000000') : c.color }} />
                        <span className="text-[10px] font-medium" style={{ color: 'var(--tx-muted)' }}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={customHex} onChange={e => setCustomHex(e.target.value)}
                      placeholder="#ff6600" maxLength={7}
                      className="flex-1 px-3 py-2 rounded-lg text-[13px] themed-border themed-border-focus"
                      style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} />
                    <button onClick={handleCustomHex}
                      className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--msg-me-text)' }}>
                      Apply
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Chat Background */}
          {activeSection === 'chat' && (
            <div className="space-y-5">
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--tx-muted)' }}>Background Presets</p>
                <div className="rounded-xl p-4" style={{ border: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-panel)' }}>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {BG_PRESETS.map(bg => (
                      <button key={bg.label} onClick={() => setChatBackground(bg.value)}
                        className="relative h-20 rounded-lg overflow-hidden"
                        style={{
                          background: bg.value || 'var(--bg-surface)',
                          border: chatBackground === bg.value ? '2px solid var(--accent)' : '1px solid var(--bg-border)',
                        }}>
                        <span className="absolute bottom-1.5 left-2 text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' }}>{bg.label}</span>
                        {chatBackground === bg.value && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                            <Check size={10} style={{ color: 'var(--msg-me-text)' }} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => bgInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-colors themed-border"
                      style={{ backgroundColor: 'var(--bg-card)', color: 'var(--tx-secondary)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}>
                      <Upload size={14} /> Upload Image
                    </button>
                    {chatBackground && (
                      <button onClick={() => setChatBackground('')}
                        className="px-3 py-2.5 rounded-lg transition-colors themed-border"
                        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--danger)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <input ref={bgInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleBgUpload(f); e.target.value = ''; }} />
                  {chatBackground && (
                    <div className="mt-4">
                      <p className="text-[11px] font-medium mb-2" style={{ color: 'var(--tx-dim)' }}>Preview</p>
                      <div className="h-36 rounded-lg overflow-hidden flex items-end p-3 gap-2"
                        style={{ background: chatBackground, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--bg-border)' }}>
                        <div className="px-3 py-1.5 rounded-xl rounded-bl-sm text-[12px]"
                          style={{ backgroundColor: 'var(--msg-other-bg)', border: '1px solid var(--msg-other-border)', color: 'var(--msg-other-text)' }}>
                          Hello there!
                        </div>
                        <div className="px-3 py-1.5 rounded-xl rounded-br-sm text-[12px] msg-me ml-auto">
                          Hi! How are you?
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* Profile */}
          {activeSection === 'profile' && (
            <div className="space-y-5">
              <section>
                <div className="rounded-xl p-5" style={{ border: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-panel)' }}>
                  <div className="flex items-center gap-4 pb-5 mb-5" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <div className="relative group flex-shrink-0">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-[17px] font-bold"
                        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--tx-primary)' }}>
                        {initials}
                      </div>
                      <label className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <Upload size={14} className="text-white" />
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ''; }} />
                      </label>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold truncate" style={{ color: 'var(--tx-primary)' }}>{auth.user?.displayName || auth.user?.username}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[12px]" style={{ color: 'var(--tx-muted)' }}>@{auth.user?.username}</p>
                        <button onClick={copyDoppId}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors"
                          style={{ color: 'var(--tx-dim)', border: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-card)' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}>
                          {copied ? <><Check size={9} /> Copied</> : <><Copy size={9} /> Copy</>}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--tx-muted)' }}>Display Name</label>
                      <div className="flex gap-2">
                        <input type="text" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)}
                          placeholder="Your name" maxLength={50}
                          className="flex-1 px-3 py-2 rounded-lg text-[13px] themed-border themed-border-focus"
                          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} />
                        <button onClick={handleSaveDisplayName}
                          className="px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                          style={{ backgroundColor: 'var(--accent)', color: 'var(--msg-me-text)' }}>
                          {nameSaved ? <Check size={14} /> : 'Save'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--tx-muted)' }}>Doppi ID</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--tx-dim)' }} />
                          <input type="text" value={newUsername} onChange={e => { setNewUsername(e.target.value.replace(/\s/g, '').toLowerCase()); setUsernameError(''); }}
                            placeholder="doppi_id" maxLength={20}
                            className="w-full pl-8 pr-3 py-2 rounded-lg text-[13px] themed-border themed-border-focus"
                            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} />
                        </div>
                        <button onClick={handleSaveUsername}
                          className="px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                          style={{ backgroundColor: 'var(--accent)', color: 'var(--msg-me-text)' }}>
                          {usernameSaved ? <Check size={14} /> : 'Save'}
                        </button>
                      </div>
                      {usernameError && <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>{usernameError}</p>}
                      <p className="text-[11px] mt-1" style={{ color: 'var(--tx-dim)' }}>3-20 chars — lowercase, numbers, underscores</p>
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--tx-muted)' }}>Status</label>
                      <div className="flex gap-2">
                        <input type="text" value={statusText} onChange={e => setStatusText(e.target.value)}
                          placeholder="What's on your mind?" maxLength={100}
                          className="flex-1 px-3 py-2 rounded-lg text-[13px] themed-border themed-border-focus"
                          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }} />
                        <button onClick={() => { if (auth.user?.id) updateStatusMut({ userId: auth.user.id, statusText }).catch(console.error); }}
                          className="px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                          style={{ backgroundColor: 'var(--accent)', color: 'var(--msg-me-text)' }}>
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-panel)' }}>
                  <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <span className="text-[13px]" style={{ color: 'var(--tx-secondary)' }}>Role</span>
                    <span className="text-[13px] font-medium" style={{ color: 'var(--tx-primary)' }}>{auth.user?.isAdmin ? 'Admin' : 'User'}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <span className="text-[13px]" style={{ color: 'var(--tx-secondary)' }}>Device</span>
                    <span className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: 'var(--tx-primary)' }}>
                      <Monitor size={13} />
                      {navigator.userAgent.includes('Mac') ? 'macOS' : navigator.userAgent.includes('Win') ? 'Windows' : 'Linux'}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
