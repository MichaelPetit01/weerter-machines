import { useState, useRef } from 'react';
import { api } from '../api';
import { blockSummary, formatDistance, formatDuration, calcPace, calcSpeed } from '../utils';

const FEELINGS = [
  { key: 'green', label: 'Fit', emoji: '💚' },
  { key: 'orange', label: 'Oké', emoji: '🟠' },
  { key: 'red', label: 'Moe', emoji: '❤️‍🔥' },
];

export default function EvaluationForm({ training, existingLog, user, onSaved, onCancel }) {
  const firstBlock = training.blocks?.[0] || {};
  const isSport = (s) => training.sport_type === s;

  const [status, setStatus] = useState(existingLog?.status || 'done');
  const [actualDist, setActualDist] = useState(existingLog?.actual_distance ?? firstBlock.distance_value ?? '');
  const [actualDur, setActualDur] = useState(existingLog?.actual_duration ?? firstBlock.duration_minutes ?? '');
  const [effort, setEffort] = useState(existingLog?.effort_score ?? '');
  const [feeling, setFeeling] = useState(existingLog?.feeling_status || '');
  const [evalText, setEvalText] = useState(existingLog?.evaluation_text || '');
  const [msgToOther, setMsgToOther] = useState(existingLog?.message_to_other || '');
  const [selfieUrl, setSelfieUrl] = useState(existingLog?.selfie_url || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selfieError, setSelfieError] = useState(false);
  const fileRef = useRef();

  const handleSelfie = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSelfieError(false);
    try {
      const res = await api.trainings.uploadSelfie(training.id, file);
      setSelfieUrl(res.selfie_url);
    } catch {
      // ignore upload error, user can retry
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (status === 'done' && !selfieUrl) {
      setSelfieError(true);
      return;
    }
    setSaving(true);
    try {
      const log = await api.trainings.saveLog(training.id, {
        status,
        actual_distance: actualDist ? parseFloat(actualDist) : null,
        actual_duration: actualDur ? parseFloat(actualDur) : null,
        actual_pace_or_speed: null,
        effort_score: effort ? parseInt(effort) : null,
        feeling_status: feeling || null,
        evaluation_text: evalText,
        message_to_other: msgToOther,
        selfie_url: selfieUrl,
      });
      onSaved(log);
    } catch {
      setSaving(false);
    }
  };

  const showActual = status === 'done' || status === 'partial';
  const distUnit = firstBlock.distance_unit || 'km';
  const paceLabel = isSport('hardlopen') ? calcPace(parseFloat(actualDist), parseFloat(actualDur)) :
                    isSport('fietsen') ? calcSpeed(parseFloat(actualDist), parseFloat(actualDur)) : null;

  return (
    <div className="space-y-4">
      {/* Status */}
      <div>
        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Status</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: 'done', label: '✅ Gedaan' },
            { val: 'partial', label: '🔶 Deels' },
            { val: 'skipped', label: '❌ Sloeg over' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => { setStatus(val); setSelfieError(false); }}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                status === val
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Actual performance */}
      {showActual && (
        <div>
          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Werkelijk uitgevoerd</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Afstand ({distUnit})
              </label>
              <input
                type="number"
                value={actualDist}
                onChange={e => setActualDist(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
                placeholder="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Tijd (min)</label>
              <input
                type="number"
                value={actualDur}
                onChange={e => setActualDur(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-orange-500"
                placeholder="0"
              />
            </div>
          </div>
          {paceLabel && (
            <p className="text-xs text-slate-400 mt-2">→ {paceLabel}</p>
          )}
        </div>
      )}

      {/* Effort score */}
      <div>
        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
          Zwaarte {effort && <span className="text-orange-400">{effort}/10</span>}
        </p>
        <input
          type="range"
          min="1" max="10"
          value={effort || 5}
          onChange={e => setEffort(e.target.value)}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>Rustig</span><span>Maximaal</span>
        </div>
      </div>

      {/* Feeling */}
      <div>
        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Gevoel</p>
        <div className="flex gap-3">
          {FEELINGS.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setFeeling(key)}
              className={`flex-1 flex flex-col items-center py-2 rounded-lg border transition-colors ${
                feeling === key
                  ? 'border-orange-500 bg-orange-950'
                  : 'border-slate-600 bg-slate-700'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-xs text-slate-400 mt-0.5">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Evaluation text */}
      <div>
        <label className="text-xs text-slate-500 mb-2 block font-medium uppercase tracking-wider">
          Hoe was het?
        </label>
        <textarea
          value={evalText}
          onChange={e => setEvalText(e.target.value)}
          rows={2}
          placeholder="Korte terugblik op de training..."
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Message to other */}
      <div>
        <label className="text-xs text-slate-500 mb-2 block font-medium uppercase tracking-wider">
          Bericht aan de ander
        </label>
        <input
          type="text"
          value={msgToOther}
          onChange={e => setMsgToOther(e.target.value)}
          placeholder="Even laten weten hoe het ging..."
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 outline-none focus:border-orange-500"
        />
      </div>

      {/* Selfie upload */}
      <div>
        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
          Selfie {status === 'done' && <span className="text-red-400">*verplicht</span>}
        </p>
        {selfieUrl ? (
          <div className="space-y-2">
            <img src={selfieUrl} alt="Selfie" className="w-full max-h-48 object-cover rounded-lg" />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm text-orange-400 font-medium"
            >
              Andere selfie kiezen
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full bg-slate-700 border-2 border-dashed border-slate-600 rounded-xl py-6 text-slate-400 text-sm font-medium flex flex-col items-center gap-2 active:bg-slate-600"
          >
            <span className="text-2xl">{uploading ? '⏳' : '📸'}</span>
            <span>{uploading ? 'Uploaden...' : 'Selfie toevoegen'}</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="camera"
          className="hidden"
          onChange={handleSelfie}
        />
      </div>

      {/* Selfie error */}
      {selfieError && (
        <div className="bg-red-950 border border-red-800 rounded-xl p-4">
          <p className="text-red-300 font-semibold text-center">
            Hey pussy, je moet je selfie nog sturen.
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 bg-slate-700 text-slate-300 font-medium py-3 rounded-lg"
        >
          Annuleren
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors flex-1"
        >
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </div>
  );
}
