import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MessageCircle, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
import { Chrome } from 'lucide-react';
import './LoginPage.css';

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

    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }

    if (!isLogin && !username) {
      setError('Введите имя пользователя');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setIsLoading(true);
    let success: boolean;
    if (isLogin) {
      success = await login(email, password);
    } else {
      success = await register(username, email, password);
    }
    setIsLoading(false);

    if (success) {
      navigate('/chats');
    } else {
      setError('Ошибка авторизации. Попробуйте ещё раз.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    const success = await loginWithGoogle();
    setIsLoading(false);
    
    if (success) {
      navigate('/chats');
    } else {
      setError('Ошибка входа через Google');
    }
  };

  if (auth.isLoading) {
    return (
      <div className="login-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <MessageCircle size={48} />
          </div>
          <h1>Doppigram</h1>
          <p className="tagline">Быстрый. Безопасный. Современный.</p>
        </div>

        <div className="login-card">
          <div className="login-tabs">
            <button
              className={`tab ${isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
            >
              Вход
            </button>
            <button
              className={`tab ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="input-group">
                <User size={20} className="input-icon" />
                <input
                  type="text"
                  placeholder="Имя пользователя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                />
              </div>
            )}

            <div className="input-group">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>

            <div className="input-group">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
            </button>
          </form>

          <div className="divider">
            <span>или</span>
          </div>

          <button className="google-button" onClick={handleGoogleLogin} disabled={isLoading}>
            <Chrome size={22} />
            <span>Продолжить с Google</span>
          </button>

          <p className="login-hint">
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
            <button onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>

        <div className="login-footer">
          <p>© 2026 Doppigram. Все права защищены.</p>
        </div>
      </div>
    </div>
  );
}
