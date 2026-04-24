import { useState, useEffect } from 'react';
import { api } from '../api';
import { getMonday, toDateStr, formatDate, formatDateFull } from '../utils';
import TrainingCard from '../components/TrainingCard';
import TrainingDrawer from '../components/TrainingDrawer';
import TrainingFormDrawer from '../components/TrainingFormDrawer';

const NL_DAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const NL_DAYS_FULL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const NL_MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatWeekLabel(monday) {
  const sunday = addDays(monday, 6);
  const m1 = NL_MONTHS[monday.getMonth()];
  const m2 = NL_MONTHS[sunday.getMonth()];
  if (m1 === m2) return `${monday.getDate()} – ${sunday.getDate()} ${m1}`;
  return `${monday.getDate()} ${m1} – ${sunday.getDate()} ${m2}`;
}

function formatDayLabel(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return `${NL_DAYS_FULL[d.getDay()]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]}`;
}

export default function Week({ user, users }) {
  const [monday, setMonday] = useState(getMonday());
  const [trainings, setTrainings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const otherUser = users?.find(u => u.id !== user.id);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.trainings.list(toDateStr(monday));
      setTrainings(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [monday]);

  const prevWeek = () => setMonday(m => addDays(m, -7));
  const nextWeek = () => setMonday(m => addDays(m, 7));

  // Group trainings by date
  const byDate = {};
  trainings.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = [];
    byDate[t.date].push(t);
  });

  // Generate 7 days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    return toDateStr(d);
  });

  const todayStr = toDateStr(new Date());

  const handleTrainingUpdate = async (updated) => {
    // Refresh selected training from updated list
    await load();
    if (selected && updated?.id === selected.id) {
      setSelected(updated);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Week navigation */}
      <div className="sticky top-0 bg-slate-950 border-b border-slate-800 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={prevWeek}
            className="text-slate-400 p-2 rounded-lg hover:bg-slate-800 transition-colors text-xl"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="font-semibold text-slate-100 text-sm">{formatWeekLabel(monday)}</p>
          </div>
          <button
            onClick={nextWeek}
            className="text-slate-400 p-2 rounded-lg hover:bg-slate-800 transition-colors text-xl"
          >
            ›
          </button>
        </div>
      </div>

      {/* Week days */}
      <div className="px-4 pt-4 space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 py-12">Laden...</div>
        ) : (
          weekDays.map(dateStr => {
            const dayTrainings = byDate[dateStr] || [];
            const isToday = dateStr === todayStr;
            const dayDate = new Date(dateStr + 'T00:00:00');
            const isPast = dateStr < todayStr;

            if (dayTrainings.length === 0) {
              return (
                <div key={dateStr} className="flex items-center gap-3">
                  <div className="w-10 shrink-0 text-center">
                    <p className={`text-xs font-medium ${isToday ? 'text-orange-400' : isPast ? 'text-slate-600' : 'text-slate-500'}`}>
                      {NL_DAYS[dayDate.getDay()]}
                    </p>
                    <p className={`text-lg font-bold leading-none mt-0.5 ${isToday ? 'text-orange-400' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>
                      {dayDate.getDate()}
                    </p>
                  </div>
                  <button
                    onClick={() => { setFormDate(dateStr); setShowForm(true); }}
                    className="flex-1 border border-dashed border-slate-700 rounded-xl py-3 text-slate-600 text-sm hover:border-orange-700 hover:text-orange-600 transition-colors"
                  >
                    + training
                  </button>
                </div>
              );
            }

            return (
              <div key={dateStr} className="flex gap-3">
                <div className="w-10 shrink-0 text-center pt-1">
                  <p className={`text-xs font-medium ${isToday ? 'text-orange-400' : isPast ? 'text-slate-600' : 'text-slate-500'}`}>
                    {NL_DAYS[dayDate.getDay()]}
                  </p>
                  <p className={`text-lg font-bold leading-none mt-0.5 ${isToday ? 'text-orange-400' : isPast ? 'text-slate-700' : 'text-slate-300'}`}>
                    {dayDate.getDate()}
                  </p>
                </div>
                <div className="flex-1 space-y-2">
                  {dayTrainings.map(t => {
                    const myLog = t.logs?.find(l => l.user_id === user.id);
                    const otherLog = t.logs?.find(l => l.user_id !== user.id);
                    return (
                      <TrainingCard
                        key={t.id}
                        training={t}
                        myLog={myLog}
                        otherLog={otherLog}
                        otherName={otherUser?.display_name || ''}
                        onClick={() => setSelected(t)}
                      />
                    );
                  })}
                  <button
                    onClick={() => { setFormDate(dateStr); setShowForm(true); }}
                    className="w-full text-slate-600 text-xs py-1.5 hover:text-orange-500 transition-colors"
                  >
                    + training toevoegen
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setFormDate(todayStr); setShowForm(true); }}
        className="fixed bottom-24 right-4 bg-orange-500 text-white w-14 h-14 rounded-full shadow-lg text-2xl flex items-center justify-center z-30"
      >
        +
      </button>

      {/* Training drawer */}
      {selected && (
        <TrainingDrawer
          training={selected}
          user={user}
          otherUser={otherUser}
          onClose={() => setSelected(null)}
          onUpdate={async () => {
            await load();
            // Refresh selected training
            const fresh = await api.trainings.list(toDateStr(monday));
            const updated = fresh.find(t => t.id === selected.id);
            if (updated) setSelected(updated);
          }}
          onDelete={() => { setSelected(null); load(); }}
        />
      )}

      {/* Add training form */}
      {showForm && (
        <TrainingFormDrawer
          defaultDate={formDate}
          user={user}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}
