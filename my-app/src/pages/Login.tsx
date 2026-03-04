import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, User, AtSign, ArrowRight, MessageSquare, Sun, Moon, Ban, Type } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [banMessage, setBanMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, createUser } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBanMessage('');
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(username.trim().toLowerCase(), password);
      if (success) {
        navigate('/chats');
      } else {
        setError('Invalid username or password');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('BANNED:')) {
        setBanMessage(msg.split('BANNED:')[1] || 'Your account has been permanently banned.');
      } else {
        setError('Invalid username or password');
      }
    }
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedUsername = username.trim().toLowerCase();
    const trimmedName = displayName.trim();

    if (!trimmedUsername || !trimmedName || !password) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(trimmedUsername)) {
      setError('Doppi ID: 3-20 chars, lowercase letters, numbers, underscores only');
      setIsLoading(false);
      return;
    }

    if (trimmedName.length > 50) {
      setError('Display name must be under 50 characters');
      setIsLoading(false);
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await createUser(trimmedUsername, password, trimmedName);
      const success = await login(trimmedUsername, password);
      if (success) {
        navigate('/chats');
      } else {
        setError('Account created but login failed. Try signing in.');
        setMode('login');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('USERNAME_TAKEN')) {
        setError('This Doppi ID is already taken');
      } else {
        setError('Registration failed. Try again.');
      }
    }
    setIsLoading(false);
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
    setBanMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, var(--tx-dim) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      <button onClick={toggleTheme}
        className="absolute top-5 right-5 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 themed-border"
        style={{ backgroundColor: 'var(--bg-card)' }}>
        {theme === 'dark' ? <Sun size={18} style={{ color: 'var(--tx-secondary)' }} /> : <Moon size={18} style={{ color: 'var(--tx-secondary)' }} />}
      </button>

      <div className="w-full max-w-[380px] relative animate-fadeInUp">
        <div onClick={() => navigate('/init-admin')}
          className="text-center mb-8 cursor-pointer hover:scale-[0.98] hover:opacity-90 transition-all active:scale-95"
          title="Initial setup">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ backgroundColor: 'var(--accent)' }}>
            <MessageSquare className="h-7 w-7" style={{ color: 'var(--bg-base)' }} />
          </div>
          <h1 className="text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--tx-primary)' }}>Doppigram</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--tx-muted)' }}>
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        <div className="rounded-2xl p-6 themed-border" style={{ backgroundColor: 'var(--bg-panel)' }}>
          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {banMessage && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm animate-slideDown"
                style={{ backgroundColor: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.15)', color: 'var(--danger)' }}>
                <Ban size={15} className="flex-shrink-0" />
                {banMessage}
              </div>
            )}

            {error && (
              <div className="px-3 py-2.5 rounded-xl text-sm animate-slideDown"
                style={{ backgroundColor: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.15)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>
                {mode === 'register' ? 'Doppi ID' : 'Username'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {mode === 'register' ? <AtSign className="h-4 w-4" style={{ color: 'var(--tx-dim)' }} /> : <User className="h-4 w-4" style={{ color: 'var(--tx-dim)' }} />}
                </div>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm transition-all themed-border themed-border-focus"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }}
                  placeholder={mode === 'register' ? 'your_doppi_id' : 'Enter username'}
                  disabled={isLoading} autoFocus />
              </div>
              {mode === 'register' && (
                <p className="text-[10px] mt-1" style={{ color: 'var(--tx-dim)' }}>3-20 chars, lowercase, numbers, underscores</p>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Display Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Type className="h-4 w-4" style={{ color: 'var(--tx-dim)' }} />
                  </div>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm transition-all themed-border themed-border-focus"
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }}
                    placeholder="Your name" disabled={isLoading} maxLength={50} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4" style={{ color: 'var(--tx-dim)' }} />
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm transition-all themed-border themed-border-focus"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }}
                  placeholder="Enter password" disabled={isLoading} />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4" style={{ color: 'var(--tx-dim)' }} />
                  </div>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm transition-all themed-border themed-border-focus"
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }}
                    placeholder="Confirm password" disabled={isLoading} />
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-base)' }}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--bg-base)' }} />
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--bg-border)' }}>
            <p className="text-xs text-center" style={{ color: 'var(--tx-muted)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={switchMode} className="font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
                {mode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] mt-5" style={{ color: 'var(--tx-dim)' }}>&copy; 2027 rootvest</p>
      </div>
    </div>
  );
}
