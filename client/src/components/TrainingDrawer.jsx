import { useState, useEffect } from 'react';
import { api } from '../api';
import SportBadge from './SportBadge';
import EvaluationForm from './EvaluationForm';
import TrainingFormDrawer from './TrainingFormDrawer';
import {
  formatDateFull, blockSummary, statusLabel, statusColor,
  feelingEmoji, formatDuration, sportEmoji
} from '../utils';

export default function TrainingDrawer({ training, user, otherUser, onClose, onUpdate, onDelete }) {
  const [myLog, setMyLog] = useState(null);
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const otherLog = training.logs?.find(l => l.user_id !== user.id) || null;

  useEffect(() => {
    api.trainings.getLog(training.id).then(setMyLog).catch(() => {});
  }, [training.id]);

  const handleLogSaved = (log) => {
    setMyLog(log);
    setShowEvalForm(false);
    onUpdate();
  };

  const handleDelete = async () => {
    if (!confirm('Training verwijderen? Dit kan niet ongedaan worden.')) return;
    setDeleting(true);
    try {
      await api.trainings.remove(training.id);
      onDelete();
    } catch {
      setDeleting(false);
    }
  };

  if (showEditForm) {
    return (
      <TrainingFormDrawer
        training={training}
        user={user}
        onClose={() => setShowEditForm(false)}
        onSaved={(t) => { setShowEditForm(false); onUpdate(t); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative mt-auto bg-slate-900 rounded-t-2xl max-h-[92vh] flex flex-col shadow-2xl border-t border-slate-700">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 scrollbar-hide">
          <div className="px-4 pb-8 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <SportBadge type={training.sport_type} size="md" />
                  {training.is_extra === 1 && (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-orange-800 bg-orange-950 text-orange-400">extra</span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-100">{training.title}</h2>
                <p className="text-slate-400 text-sm mt-0.5 capitalize">{formatDateFull(training.date)}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 p-1 text-xl leading-none">✕</button>
            </div>

            {/* Description */}
            {training.description && (
              <p className="text-slate-300 text-sm leading-relaxed">{training.description}</p>
            )}

            {/* Training blocks */}
            {training.blocks?.length > 0 && (
              <div className="bg-slate-800 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Trainingsblokken</p>
                {training.blocks.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {training.blocks.length > 1 && (
                      <span className="text-xs text-slate-600 w-4 shrink-0">{i + 1}.</span>
                    )}
                    <p className="text-sm text-slate-300">{blockSummary(b, training.sport_type)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* My evaluation */}
            <div className="bg-slate-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Mijn evaluatie</p>
              {showEvalForm ? (
                <EvaluationForm
                  training={training}
                  existingLog={myLog}
                  user={user}
                  onSaved={handleLogSaved}
                  onCancel={() => setShowEvalForm(false)}
                />
              ) : myLog && myLog.status !== 'planned' ? (
                <LogDisplay log={myLog} onEdit={() => setShowEvalForm(true)} />
              ) : (
                <button
                  onClick={() => setShowEvalForm(true)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Evaluatie invullen
                </button>
              )}
            </div>

            {/* Other user's evaluation */}
            {otherLog && otherLog.status !== 'planned' && (
              <div className="bg-slate-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {otherUser?.display_name || 'De ander'}
                </p>
                <LogDisplay log={otherLog} readOnly />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowEditForm(true)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                ✏️ Bewerken
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-950 hover:bg-red-900 text-red-400 font-medium py-2.5 rounded-lg transition-colors text-sm border border-red-900"
              >
                🗑️ Verwijderen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogDisplay({ log, onEdit, readOnly = false }) {
  const statusColors = {
    done: 'text-emerald-400', partial: 'text-yellow-400', skipped: 'text-red-400',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={`font-semibold ${statusColors[log.status] || 'text-slate-400'}`}>
          {statusLabel(log.status)}
        </span>
        <div className="flex items-center gap-2">
          {log.feeling_status && <span className="text-lg">{feelingEmoji(log.feeling_status)}</span>}
          {log.effort_score && (
            <span className="text-sm font-semibold text-orange-400">{log.effort_score}/10</span>
          )}
        </div>
      </div>

      {log.evaluation_text && (
        <p className="text-slate-300 text-sm">{log.evaluation_text}</p>
      )}

      {log.message_to_other && (
        <div className="bg-slate-700 rounded-lg px-3 py-2">
          <p className="text-xs text-slate-500 mb-1">Bericht</p>
          <p className="text-sm text-slate-200">{log.message_to_other}</p>
        </div>
      )}

      {log.selfie_url && (
        <img
          src={log.selfie_url}
          alt="Selfie"
          className="w-full max-h-64 object-cover rounded-lg"
        />
      )}

      {!readOnly && onEdit && (
        <button
          onClick={onEdit}
          className="text-sm text-orange-400 font-medium py-1"
        >
          ✏️ Evaluatie aanpassen
        </button>
      )}
    </div>
  );
}
