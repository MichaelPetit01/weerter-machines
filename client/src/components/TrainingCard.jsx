import SportBadge from './SportBadge';
import { formatDate, statusColor, statusLabel, blockSummary, totalBlockDuration, formatDuration } from '../utils';

export default function TrainingCard({ training, myLog, otherLog, otherName, onClick }) {
  const myStatus = myLog?.status || 'planned';
  const otherStatus = otherLog?.status;
  const totalMin = training.blocks?.reduce((s, b) => s + (b.duration_minutes || 0), 0) || 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 active:bg-slate-750 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SportBadge type={training.sport_type} />
            {training.is_extra === 1 && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-orange-800 bg-orange-950 text-orange-400 font-medium">
                extra
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-100 truncate">{training.title}</h3>
        </div>
        <span className="text-slate-500 text-sm whitespace-nowrap shrink-0 mt-0.5">
          {totalMin > 0 ? formatDuration(totalMin) : ''}
        </span>
      </div>

      {/* Blocks summary */}
      {training.blocks?.length > 0 && (
        <div className="space-y-1">
          {training.blocks.map((b, i) => (
            <p key={i} className="text-sm text-slate-400">
              {training.blocks.length > 1 && <span className="text-slate-600 mr-1">{i + 1}.</span>}
              {blockSummary(b, training.sport_type)}
            </p>
          ))}
        </div>
      )}

      {/* Status row */}
      <div className="flex items-center gap-2 pt-1">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(myStatus)}`}>
          Jij: {statusLabel(myStatus)}
        </span>
        {otherStatus && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(otherStatus)}`}>
            {otherName}: {statusLabel(otherStatus)}
          </span>
        )}
        <span className="ml-auto text-slate-600 text-sm">›</span>
      </div>
    </button>
  );
}
