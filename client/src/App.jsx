import { useState, useEffect } from 'react';
import { api } from './api';
import Nav from './components/Nav';
import Login from './pages/Login';
import Home from './pages/Home';
import Week from './pages/Week';
import Chat from './pages/Chat';
import Stats from './pages/Stats';

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('home');

  useEffect(() => {
    api.me()
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch all users for "other user" context
  useEffect(() => {
    if (user) {
      // Derive other user from stats (quick hack for 2-user app)
      api.stats()
        .then(stats => setUsers(stats.map(s => ({ id: s.user_id, display_name: s.display_name }))))
        .catch(() => {});
    }
  }, [user]);

  const handleLogin = (u) => {
    setUser(u);
  };

  const handleLogout = async () => {
    await api.logout().catch(() => {});
    setUser(null);
    setTab('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🏊🚴🏃</div>
          <p className="text-slate-400">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Main content */}
      <div className="pb-16">
        {tab === 'home' && <Home user={user} users={users} onTabChange={setTab} />}
        {tab === 'week' && <Week user={user} users={users} />}
        {tab === 'chat' && <Chat user={user} />}
        {tab === 'stats' && <Stats user={user} />}
      </div>

      {/* Bottom nav */}
      <Nav active={tab} onChange={setTab} />

      {/* Logout (subtle, in corner) */}
      {tab === 'stats' && (
        <button
          onClick={handleLogout}
          className="fixed top-4 right-4 text-xs text-slate-600 hover:text-slate-400 z-20"
        >
          Uitloggen
        </button>
      )}
    </div>
  );
}
