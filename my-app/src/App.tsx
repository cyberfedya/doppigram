import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import InitAdmin from './pages/InitAdmin';
import { ChatListPage } from './pages/ChatListPage';
import SettingsPage from './pages/SettingsPage';
import './styles/global.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { auth, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="text-center animate-fadeIn">
          <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--bg-border)', borderTopColor: 'var(--accent)' }}></div>
          <p className="text-sm font-medium" style={{ color: 'var(--tx-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { auth, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="text-center animate-fadeIn">
          <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--bg-border)', borderTopColor: 'var(--accent)' }}></div>
          <p className="text-sm font-medium" style={{ color: 'var(--tx-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!auth.user?.isAdmin) {
    return <Navigate to="/chats" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/init-admin" element={<InitAdmin />} />
      {/* Секретный маршрут для админки */}
      <Route
        path="/vpp"
        element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        }
      />
      <Route
        path="/chats"
        element={
          <ProtectedRoute>
            <ChatListPage />
          </ProtectedRoute>
        }
      />
      <Route path="/chat/:id" element={<Navigate to="/chats" replace />} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/chats" replace />} />
      <Route path="*" element={<Navigate to="/chats" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
