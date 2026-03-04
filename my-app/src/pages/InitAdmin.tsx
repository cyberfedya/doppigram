import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTheme } from '../context/ThemeContext';
import { Key, UserPlus, CheckCircle, AlertCircle, Sun, Moon } from 'lucide-react';

export default function InitAdmin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const createInitialAdmin = useMutation(api.seed.createInitialAdmin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!username.trim() || !password.trim()) { setMessage({ type: 'error', text: 'All fields are required' }); return; }
    if (password.length < 6) { setMessage({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    setIsLoading(true);
    try {
      await createInitialAdmin({ username, password });
      setMessage({ type: 'success', text: `Admin "${username}" created! Redirecting...` });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error: ' + error });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, var(--tx-dim) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      <button onClick={toggleTheme}
        className="absolute top-5 right-5 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 themed-border"
        style={{ backgroundColor: 'var(--bg-card)' }}>
        {theme === 'dark' ? <Sun size={18} style={{ color: 'var(--tx-secondary)' }} /> : <Moon size={18} style={{ color: 'var(--tx-secondary)' }} />}
      </button>

      <div className="w-full max-w-[400px] relative animate-fadeInUp">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 60px rgba(255,255,255,0.06)' }}>
            <Key className="h-7 w-7" style={{ color: 'var(--bg-base)' }} />
          </div>
          <h1 className="text-[28px] font-extrabold tracking-tight" style={{ color: 'var(--tx-primary)' }}>Initial Setup</h1>
          <p className="mt-1.5 text-sm font-medium" style={{ color: 'var(--tx-muted)' }}>Create the first administrator</p>
        </div>

        <div className="rounded-2xl p-7 themed-border" style={{ backgroundColor: 'var(--bg-panel)' }}>
          <div className="flex items-start gap-2.5 mb-6 p-3.5 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--tx-secondary)' }} />
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--tx-secondary)' }}>
              This page is used only once. After creating the first admin, it will no longer be needed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {message && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-slideDown"
                style={{
                  backgroundColor: message.type === 'success' ? 'rgba(74,222,128,0.06)' : 'rgba(255,68,68,0.06)',
                  border: `1px solid ${message.type === 'success' ? 'rgba(74,222,128,0.2)' : 'rgba(255,68,68,0.15)'}`,
                  color: message.type === 'success' ? 'var(--online)' : 'var(--danger)'
                }}>
                {message.type === 'success' && <CheckCircle className="h-4 w-4 flex-shrink-0" />}
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Admin Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all themed-border themed-border-focus"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }}
                placeholder="admin" disabled={isLoading} autoFocus />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--tx-muted)' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all themed-border themed-border-focus"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--tx-primary)' }}
                placeholder="Min 6 characters" disabled={isLoading} />
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-base)' }}>
              {isLoading ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--bg-base)' }} /> : <><UserPlus className="h-4 w-4" /> Create Admin</>}
            </button>
          </form>

          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--bg-border)' }}>
            <p className="text-[11px] text-center" style={{ color: 'var(--tx-dim)' }}>After creation, you will be redirected to the login page</p>
          </div>
        </div>
      </div>
    </div>
  );
}
