import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import InitAdmin from './pages/InitAdmin';
import { ChatListPage } from './pages/ChatListPage';
import { ChatPage } from './pages/ChatPage';
import './styles/global.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { auth, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#555] text-sm font-medium">Загрузка...</p>
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#555] text-sm font-medium">Загрузка...</p>
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
      <Route
        path="/chat/:id"
        element={
          <ProtectedRoute>
            <ChatPage />
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
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
