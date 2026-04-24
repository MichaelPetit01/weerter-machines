import { useState, useEffect } from 'react';
import { api } from '../api';
import { daysUntil } from '../utils';

const RACE_DATE = '2026-06-13';

// Total planned distances from the seed schema
const TOTAL_PLAN = {
  swim_m: 750 + 1000 + 750 + 800 + 750 + 1000 + 750 + 400, // ~6200m
  bike_km: 25 + 35 + 25 + 20 + 40 + 15,                     // ~160km
  run_km: 5 + 7 + 6 + 8 + 3 + 6 + 5 + 3 + 5,               // ~48km
};

export default function Stats({ user }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const daysLeft = daysUntil(RACE_DATE);

  useEffect(() => {
    api.stats().then(data => { setStats(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const me = stats.find(s => s.user_id === user.id);
  const other = stats.find(s => s.user_id !== user.id);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-500">Laden...</div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">📊 Stats</h1>
        <p className="text-slate-500 text-sm mt-0.5">{daysLeft} dagen te gaan</p>
      </div>

      {/* Head to head */}
      {me && other && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Afgeronde trainingen</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 text-center">
              <div className="text-3xl font-black text-orange-400">{me.completed}</div>
              <div className="text-xs text-slate-400 mt-1">{me.display_name}</div>
            </div>
            <div className="text-slate-600 font-bold text-xl">vs</div>
            <div className="flex-1 text-center">
              <div className="text-3xl font-black text-slate-300">{other.completed}</div>
              <div className="text-xs text-slate-400 mt-1">{other.display_name}</div>
            </div>
          </div>
        </div>
      )}

      {/* Per person */}
      {[me, other].filter(Boolean).map((s, idx) => (
        <div key={s.user_id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-lg">{s.display_name}</h2>
            {s.avg_effort && (
              <span className="text-sm text-slate-400">
                Gem. zwaarte: <span className="text-orange-400 font-semibold">{s.avg_effort}/10</span>
              </span>
            )}
          </div>

          <StatRow
            emoji="🏊"
            label="Zwemmen"
            value={s.swim_distance ? `${s.swim_distance}m` : '—'}
            sub={s.swim_distance ? `van ~${TOTAL_PLAN.swim_m}m gepland` : 'nog niets gelogd'}
            pct={Math.min(100, (s.swim_distance / TOTAL_PLAN.swim_m) * 100)}
            color="bg-blue-500"
          />
          <StatRow
            emoji="🚴"
            label="Fietsen"
            value={s.bike_distance ? `${s.bike_distance} km` : '—'}
            sub={s.bike_distance ? `van ~${TOTAL_PLAN.bike_km}km gepland` : 'nog niets gelogd'}
            pct={Math.min(100, (s.bike_distance / TOTAL_PLAN.bike_km) * 100)}
            color="bg-emerald-500"
          />
          <StatRow
            emoji="🏃"
            label="Hardlopen"
            value={s.run_distance ? `${s.run_distance} km` : '—'}
            sub={s.run_distance ? `van ~${TOTAL_PLAN.run_km}km gepland` : 'nog niets gelogd'}
            pct={Math.min(100, (s.run_distance / TOTAL_PLAN.run_km) * 100)}
            color="bg-orange-500"
          />

          {s.partial > 0 && (
            <p className="text-xs text-slate-500">{s.partial} training{s.partial !== 1 ? 'en' : ''} deels gedaan</p>
          )}
        </div>
      ))}

      {/* Motivation */}
      <div className="bg-orange-950/40 border border-orange-900/50 rounded-2xl p-4 text-center">
        <p className="text-orange-300 font-semibold">
          {daysLeft > 20
            ? 'Elke training telt. Blijf scherp. 💪'
            : daysLeft > 7
            ? 'De eindstreep komt in zicht. Gas erop! 🔥'
            : daysLeft > 0
            ? 'Raceweek! Rustig blijven en vertrouwen op je training. 🏁'
            : 'De race is geweest. Legends!'}
        </p>
      </div>
    </div>
  );
}

function StatRow({ emoji, label, value, sub, pct, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300 flex items-center gap-1.5">
          <span>{emoji}</span>
          <span>{label}</span>
        </span>
        <span className="text-sm font-bold text-white">{value}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${isNaN(pct) ? 0 : pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-600">{sub}</p>
    </div>
  );
}
