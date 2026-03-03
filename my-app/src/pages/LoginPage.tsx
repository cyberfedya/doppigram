import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MessageCircle, Lock, Mail, User, Eye, EyeOff, Chrome } from 'lucide-react';

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register, loginWithGoogle, auth } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Заполните все поля'); return; }
    if (!isLogin && !username) { setError('Введите имя пользователя'); return; }
    if (password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }
    setIsLoading(true);
    const success = isLogin ? await login(email, password) : await register(username, email, password);
    setIsLoading(false);
    if (success) navigate('/chats');
    else setError('Ошибка авторизации. Попробуйте ещё раз.');
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    const success = await loginWithGoogle();
    setIsLoading(false);
    // Не перенаправляем сразу - AppContext сам определит, нужен ли онбординг
    if (!success) setError('Ошибка входа через Google');
  };

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a10]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-[rgba(74,108,247,0.2)] border-t-[#4a6cf7] rounded-full animate-spin" />
          <p className="text-[#5a5a88] text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full bg-[#1a1a2c] border border-[#28283c] rounded-xl py-3 pl-11 pr-4 text-sm text-[#d0d0ec] placeholder-[#34344e] outline-none transition-all duration-200 focus:border-[#4a6cf7] focus:shadow-[0_0_0_3px_rgba(74,108,247,0.12)]";

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a10] p-4">
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Header */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6c3de5] to-[#3d8ef5] flex items-center justify-center shadow-[0_6px_24px_rgba(108,61,229,0.4)]">
            <MessageCircle size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#f0f0f8] tracking-tight">Doppigram</h1>
          <p className="text-sm text-[#5a5a88]">Быстрый. Безопасный. Современный.</p>
        </div>

        {/* Card */}
        <div className="bg-[#13131c] border border-[#1e1e2c] rounded-[20px] p-7 flex flex-col gap-5">
          {/* Tabs */}
          <div className="flex bg-[#0f0f18] rounded-xl p-1 gap-1">
            {(['Вход', 'Регистрация'] as const).map((label, i) => {
              const active = isLogin === (i === 0);
              return (
                <button
                  key={label}
                  onClick={() => { setIsLogin(i === 0); setError(''); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${active ? 'bg-gradient-to-br from-[#4a6cf7] to-[#3a5ce5] text-white shadow-[0_3px_10px_rgba(74,108,247,0.3)]' : 'text-[#5a5a88] hover:text-[#9090c0]'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {!isLogin && (
              <div className="relative">
                <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#40405e] pointer-events-none" />
                <input type="text" placeholder="Имя пользователя" value={username} onChange={e => setUsername(e.target.value)} className={inputClass} />
              </div>
            )}
            <div className="relative">
              <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#40405e] pointer-events-none" />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#40405e] pointer-events-none" />
              <input type={showPassword ? 'text' : 'password'} placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} className={`${inputClass} pr-11`} />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#40405e] hover:text-[#8888b0] transition-colors">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && (
              <p className="text-[#e06060] text-xs font-medium bg-[rgba(224,80,80,0.1)] border border-[rgba(224,80,80,0.2)] rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={isLoading}
              className="mt-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-br from-[#4a6cf7] to-[#3a5ce5] text-white shadow-[0_4px_14px_rgba(74,108,247,0.35)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(74,108,247,0.45)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0">
              {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1e1e2c]" />
            <span className="text-xs text-[#38385a] font-medium">или</span>
            <div className="flex-1 h-px bg-[#1e1e2c]" />
          </div>

          {/* Google */}
          <button onClick={handleGoogleLogin} disabled={isLoading}
            className="flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold bg-[#1a1a2c] border border-[#28283c] text-[#c0c0e0] transition-all duration-200 hover:bg-[#22223a] hover:border-[#38385a] disabled:opacity-60">
            <Chrome size={19} />
            Продолжить с Google
          </button>

          {/* Switch */}
          <p className="text-center text-xs text-[#48487a]">
            {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
            <button onClick={() => setIsLogin(v => !v)} className="text-[#4a6cf7] font-semibold hover:text-[#6888ff] transition-colors">
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-[#2e2e48]">© 2026 Doppigram. Все права защищены.</p>
      </div>
    </div>
  );
}
