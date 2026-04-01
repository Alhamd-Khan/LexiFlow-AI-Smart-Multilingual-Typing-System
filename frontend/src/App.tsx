import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation, Link } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import EditorPage from './pages/EditorPage';
import MyDocumentsPage from './pages/MyDocumentsPage';
import SharedInboxPage from './pages/SharedInboxPage';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';
import LandingPage from './pages/LandingPage';
import { useAuthStore } from './store/authStore';
import { useChatStore } from './store/chatStore';
import api from './api';
import { socket } from './socket';
import MainLogo from './components/MainLogo';
import CustomCursor from './components/CustomCursor';

// ── Mobile nav icons ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    to: '/editor',
    label: 'Editor',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    to: '/documents',
    label: 'Docs',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: '/inbox',
    label: 'Inbox',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
  {
    to: '/chat',
    label: 'Chat',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    to: '/history',
    label: 'History',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

function AppContent() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { totalUnread, setTotalUnread } = useChatStore();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  const isChatPageRef = useRef(false);
  useEffect(() => {
    isChatPageRef.current = location.pathname === '/chat';
  }, [location.pathname]);

  // Global socket & unread logic
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    socket.io.opts.query = { userId: user.id };
    socket.connect();

    const fetchTotalUnread = async () => {
      try {
        const resp = await api.get('/chat/users');
        const total = resp.data.reduce((sum: number, c: any) => sum + c.unreadCount, 0);
        setTotalUnread(total);
      } catch (err) {
        console.error('Failed to fetch global unread:', err);
      }
    };

    fetchTotalUnread();

    const handleGlobalMessage = (data: any) => {
      if (data.fromId !== user.id && !isChatPageRef.current) {
        fetchTotalUnread();
      }
    };

    socket.on('chat:message', handleGlobalMessage);

    return () => {
      socket.off('chat:message', handleGlobalMessage);
      socket.disconnect();
    };
  }, [isAuthenticated, user, setTotalUnread]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      logout();
      window.location.href = '/auth';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-shell flex flex-col md:flex-row min-h-screen">
      {/* ── Desktop Sidebar (md and up) — UNCHANGED ── */}
      {isAuthenticated && !isLandingPage && (
        <aside className="app-sidebar hidden md:flex w-64 flex-shrink-0 flex-col p-6 z-50">
          <div className="flex items-center justify-between md:justify-start mb-8">
            <Link to="/" className="hover:opacity-90 transition-opacity">
              <MainLogo className="h-16 w-auto object-contain origin-left scale-[1.2] md:scale-125" />
            </Link>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            {[
              { to: '/editor', label: 'Editor' },
              { to: '/documents', label: 'Documents' },
              { to: '/inbox', label: 'Inbox' },
              { to: '/chat', label: 'Chat' },
              { to: '/history', label: 'History' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-semibold transition-all w-full text-left ${
                    isActive
                      ? 'nav-btn-active'
                      : 'nav-btn-inactive hover:bg-[rgba(255,255,255,0.5)] rounded-xl'
                  }`
                }
              >
                <div className="flex justify-between items-center w-full">
                  <span>{label}</span>
                  {to === '/chat' && totalUnread > 0 && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#b41340] text-[10px] font-bold text-white ml-2">
                      {totalUnread}
                    </span>
                  )}
                </div>
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 flex flex-col gap-3">
            <div className="px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.5)] border border-[rgba(171,173,175,0.2)] flex items-center justify-center">
              <span className="text-sm font-semibold text-[#595c5e] truncate">@{user?.username}</span>
            </div>
            <button onClick={handleLogout} className="app-button-secondary w-full">Logout</button>
          </div>
        </aside>
      )}

      {/* ── Mobile Top Bar (< md) — only when authenticated & not landing ── */}
      {isAuthenticated && !isLandingPage && (
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-xl border-b border-[var(--outline-variant)] sticky top-0 z-50">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <MainLogo className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#595c5e]">@{user?.username}</span>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-[#4a40e0] bg-[#4a40e0]/10 px-3 py-1.5 rounded-full border border-[#4a40e0]/20 active:scale-95 transition-all"
            >
              Logout
            </button>
          </div>
        </header>
      )}

      {/* ── Main Content ── */}
      <main className={`flex-grow relative w-full ${(!isLandingPage && isAuthenticated) ? 'bg-transparent flex flex-col items-center' : ''}`}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={isAuthenticated ? <Navigate to="/editor" replace /> : <AuthPage />} />
          <Route path="/editor" element={isAuthenticated ? <EditorPage /> : <Navigate to="/auth" replace />} />
          <Route path="/documents" element={isAuthenticated ? <MyDocumentsPage /> : <Navigate to="/auth" replace />} />
          <Route path="/inbox" element={isAuthenticated ? <SharedInboxPage /> : <Navigate to="/auth" replace />} />
          <Route path="/chat" element={isAuthenticated ? <ChatPage /> : <Navigate to="/auth" replace />} />
          <Route path="/history" element={isAuthenticated ? <HistoryPage /> : <Navigate to="/auth" replace />} />
        </Routes>
      </main>

      {/* ── Mobile Bottom Nav Bar (< md) ── */}
      {isAuthenticated && !isLandingPage && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[var(--outline-variant)] flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-[10px] font-bold transition-colors relative ${
                  isActive ? 'text-[#4a40e0]' : 'text-[#9a9d9f]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}>
                    {icon}
                  </span>
                  <span>{label}</span>
                  {to === '/chat' && totalUnread > 0 && (
                    <span className="absolute top-1.5 right-[calc(50%-10px)] inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#b41340] text-[8px] font-black text-white">
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <CustomCursor />
      <AppContent />
    </Router>
  );
}

export default App;
