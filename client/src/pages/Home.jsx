import { useState, useEffect } from 'react';
import { api } from '../api';
import { daysUntil, formatDateFull, blockSummary, formatDuration, sportEmoji, sportLabel } from '../utils';
import SportBadge from '../components/SportBadge';
import TrainingDrawer from '../components/TrainingDrawer';
import TrainingFormDrawer from '../components/TrainingFormDrawer';

const RACE_DATE = '2026-06-13';

export default function Home({ user, users, onTabChange }) {
  const [nextTraining, setNextTraining] = useState(null);
  const [weekSummary, setWeekSummary] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const otherUser = users?.find(u => u.id !== user.id);
  const daysLeft = daysUntil(RACE_DATE);

  const load = async () => {
    try {
      const [next, summary] = await Promise.all([
        api.trainings.next(),
        api.weekSummary(),
      ]);
      setNextTraining(next);
      setWeekSummary(summary);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const myWeekStats = weekSummary?.users?.find(u => u.user_id === user.id);
  const otherWeekStats = weekSummary?.users?.find(u => u.user_id !== user.id);

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-black text-white">
          Hey {user.display_name} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Klaar voor vandaag?</p>
      </div>

      {/* Countdown */}
      <div className="bg-gradient-to-br from-orange-900/40 to-slate-800 border border-orange-800/50 rounded-2xl p-5 text-center">
        <div className="text-5xl font-black text-orange-400">{daysLeft}</div>
        <div className="text-orange-300 font-semibold mt-1">
          {daysLeft === 1 ? 'dag' : 'dagen'} tot de race
        </div>
        <div className="text-slate-400 text-xs mt-2">Sprinttriatlon · 13 juni 2026</div>
      </div>

      {/* Race goal */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Het doel</p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <GoalItem emoji="🏊" label="Zwemmen" value="750m" sub="~18 min" />
          <GoalItem emoji="🚴" label="Fietsen" value="20km" sub="~30,5 km/u" />
          <GoalItem emoji="🏃" label="Lopen" value="5km" sub="~5:15/km" />
        </div>
        <div className="text-center bg-orange-950/60 rounded-xl py-2 border border-orange-900/50">
          <span className="text-orange-300 font-bold">Doel: onder 1:25:00</span>
          <span className="text-slate-500 text-xs ml-2">incl. wissels</span>
        </div>
      </div>

      {/* Next training */}
      {nextTraining ? (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Eerstvolgende training</p>
          <button
            onClick={() => setSelectedTraining(nextTraining)}
            className="w-full text-left bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3 active:bg-slate-750"
          >
            <div className="flex items-center gap-2">
              <SportBadge type={nextTraining.sport_type} size="md" />
              <span className="text-slate-400 text-sm capitalize">{formatDateFull(nextTraining.date)}</span>
            </div>
            <h3 className="text-lg font-bold text-white">{nextTraining.title}</h3>
            {nextTraining.description && (
              <p className="text-slate-400 text-sm leading-relaxed">{nextTraining.description}</p>
            )}
            {nextTraining.blocks?.length > 0 && (
              <div className="space-y-1 pt-1">
                {nextTraining.blocks.map((b, i) => (
                  <p key={i} className="text-sm text-slate-300">
                    {nextTraining.blocks.length > 1 && <span className="text-slate-600 mr-1">{i + 1}.</span>}
                    {blockSummary(b, nextTraining.sport_type)}
                  </p>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-orange-400 font-semibold">Training openen →</span>
              <span className="text-slate-600 text-sm">
                {formatDuration(nextTraining.blocks?.reduce((s, b) => s + (b.duration_minutes || 0), 0))}
              </span>
            </div>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-950 border border-emerald-800 rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2">🏁</div>
          <p className="text-emerald-300 font-bold">Alle trainingen klaar!</p>
          <p className="text-slate-400 text-sm mt-1">13 juni is het feest.</p>
        </div>
      )}

      {/* Week summary */}
      {weekSummary && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Deze week</p>
          <div className="space-y-2">
            <WeekRow
              name={user.display_name}
              completed={myWeekStats?.completed || 0}
              total={weekSummary.total_planned}
              isMe
            />
            {otherWeekStats && (
              <WeekRow
                name={otherUser?.display_name || otherWeekStats.display_name}
                completed={otherWeekStats.completed || 0}
                total={weekSummary.total_planned}
              />
            )}
          </div>
        </div>
      )}

      {/* Extra training + chat buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
        >
          + Extra training
        </button>
        <button
          onClick={() => onTabChange('chat')}
          className="bg-slate-800 border border-slate-700 text-slate-300 font-semibold py-3.5 rounded-xl text-sm"
        >
          💬 Chat
        </button>
      </div>

      {/* Modals */}
      {selectedTraining && (
        <TrainingDrawer
          training={selectedTraining}
          user={user}
          otherUser={otherUser}
          onClose={() => setSelectedTraining(null)}
          onUpdate={load}
          onDelete={() => { setSelectedTraining(null); load(); }}
        />
      )}

      {showAddForm && (
        <TrainingFormDrawer
          user={user}
          isExtra
          onClose={() => setShowAddForm(false)}
          onSaved={() => { setShowAddForm(false); load(); }}
        />
      )}
    </div>
  );
}

function GoalItem({ emoji, label, value, sub }) {
  return (
    <div className="text-center">
      <div className="text-xl mb-1">{emoji}</div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-200">{value}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function WeekRow({ name, completed, total, isMe }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={isMe ? 'text-white font-medium' : 'text-slate-400'}>{name}</span>
        <span className={isMe ? 'text-orange-400 font-semibold' : 'text-slate-500'}>{completed}/{total}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isMe ? 'bg-orange-500' : 'bg-slate-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-slate-400">Laden...</div>
    </div>
  );
}
