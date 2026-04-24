import { useState } from 'react';
import { api } from '../api';
import { todayStr } from '../utils';

const SPORTS = [
  { key: 'zwemmen', label: 'Zwemmen', emoji: '🏊' },
  { key: 'fietsen', label: 'Fietsen', emoji: '🚴' },
  { key: 'hardlopen', label: 'Hardlopen', emoji: '🏃' },
];

const emptyBlock = () => ({ distance_value: '', distance_unit: 'km', duration_minutes: '' });

function parseBlocks(raw) {
  return raw.map(b => ({
    distance_value: b.distance_value ?? '',
    distance_unit: b.distance_unit ?? 'km',
    duration_minutes: b.duration_minutes ?? '',
  }));
}

export default function TrainingFormDrawer({ training, defaultDate, isExtra, user, onClose, onSaved }) {
  const isEdit = !!training;
  const [date, setDate] = useState(training?.date || defaultDate || todayStr());
  const [sport, setSport] = useState(training?.sport_type || 'hardlopen');
  const [title, setTitle] = useState(training?.title || '');
  const [desc, setDesc] = useState(training?.description || '');
  const [extra, setExtra] = useState(isExtra || training?.is_extra === 1 || false);
  const [blocks, setBlocks] = useState(training?.blocks?.length ? parseBlocks(training.blocks) : [emptyBlock()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const distUnit = sport === 'zwemmen' ? 'm' : 'km';

  const updateBlock = (i, field, val) => {
    setBlocks(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: val } : b));
  };

  const handleSave = async () => {
    if (!date || !title.trim()) { setError('Datum en titel zijn verplicht.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        date,
        title: title.trim(),
        description: desc.trim(),
        sport_type: sport,
        is_extra: extra,
        blocks: blocks.map(b => ({
          distance_value: b.distance_value ? parseFloat(b.distance_value) : null,
          distance_unit: distUnit,
          duration_minutes: b.duration_minutes ? parseFloat(b.duration_minutes) : null,
        })).filter(b => b.distance_value || b.duration_minutes),
      };
      const saved = isEdit
        ? await api.trainings.update(training.id, payload)
        : await api.trainings.create(payload);
      onSaved(saved);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative mt-auto bg-slate-900 rounded-t-2xl max-h-[94vh] flex flex-col shadow-2xl border-t border-slate-700">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>

        <div className="overflow-y-auto flex-1 scrollbar-hide">
          <div className="px-4 pb-8 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-lg font-bold text-slate-100">
                {isEdit ? 'Training bewerken' : 'Training toevoegen'}
              </h2>
              <button onClick={onClose} className="text-slate-400 text-xl leading-none p-1">✕</button>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-slate-500 mb-2 block font-medium uppercase tracking-wider">Datum</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-3 text-slate-100 outline-none focus:border-orange-500"
              />
            </div>

            {/* Sport type */}
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Sporttype</p>
              <div className="grid grid-cols-3 gap-2">
                {SPORTS.map(({ key, label, emoji }) => (
                  <button
                    key={key}
                    onClick={() => { setSport(key); setBlocks(prev => prev.map(b => ({ ...b, distance_unit: key === 'zwemmen' ? 'm' : 'km' }))); }}
                    className={`flex flex-col items-center py-3 rounded-xl border transition-colors ${
                      sport === key
                        ? 'border-orange-500 bg-orange-950 text-orange-300'
                        : 'border-slate-600 bg-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-xs mt-1 font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs text-slate-500 mb-2 block font-medium uppercase tracking-wider">Titel</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Bijv. Intervallen 5x1km"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-orange-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-slate-500 mb-2 block font-medium uppercase tracking-wider">Beschrijving (optioneel)</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={2}
                placeholder="Wat is het doel van de training?"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Training blocks */}
            <div>
              <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Trainingsblokken</p>
              <div className="space-y-3">
                {blocks.map((b, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl p-3 space-y-3">
                    {blocks.length > 1 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Blok {i + 1}</span>
                        <button onClick={() => setBlocks(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 text-xs">Verwijder</button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Afstand ({distUnit})</label>
                        <input
                          type="number"
                          value={b.distance_value}
                          onChange={e => updateBlock(i, 'distance_value', e.target.value)}
                          placeholder="0"
                          step="0.1"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Tijd (min)</label>
                        <input
                          type="number"
                          value={b.duration_minutes}
                          onChange={e => updateBlock(i, 'duration_minutes', e.target.value)}
                          placeholder="0"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setBlocks(prev => [...prev, emptyBlock()])}
                  className="w-full border-2 border-dashed border-slate-600 rounded-xl py-3 text-slate-500 text-sm font-medium hover:border-orange-700 transition-colors"
                >
                  + Blok toevoegen
                </button>
              </div>
            </div>

            {/* Extra training toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setExtra(v => !v)}
                className={`w-12 h-6 rounded-full transition-colors ${extra ? 'bg-orange-500' : 'bg-slate-600'} relative`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${extra ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
              <span className="text-slate-300 text-sm">Extra training (buiten schema)</span>
            </label>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 bg-slate-700 text-slate-300 font-medium py-3 rounded-lg">
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {saving ? 'Opslaan...' : isEdit ? 'Opslaan' : 'Toevoegen'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
