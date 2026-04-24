import { useState } from 'react';
import { api } from '../api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(username.trim(), password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🏊🚴🏃</div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            De Weerter<br />
            <span className="text-orange-500">Machines</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">13 juni. Geen excuses.</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Gebruikersnaam"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-500 outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Wachtwoord"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-500 outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-colors text-lg"
          >
            {loading ? 'Inloggen...' : 'Let\'s go 💪'}
          </button>
        </form>
      </div>
    </div>
  );
}
