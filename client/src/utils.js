const NL_DAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const NL_DAYS_FULL = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const NL_MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

export function parseDate(dateStr) {
  // Parse YYYY-MM-DD as local date, not UTC
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(dateStr) {
  const d = parseDate(dateStr);
  return `${NL_DAYS[d.getDay()]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]}`;
}

export function formatDateFull(dateStr) {
  const d = parseDate(dateStr);
  return `${NL_DAYS_FULL[d.getDay()]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]}`;
}

export function formatDateShort(dateStr) {
  const d = parseDate(dateStr);
  return `${d.getDate()} ${NL_MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

export function todayStr() {
  return toDateStr(new Date());
}

export function daysUntil(dateStr) {
  const target = parseDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

export function formatDuration(minutes) {
  if (!minutes) return '—';
  const m = Math.round(minutes);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return min > 0 ? `${h}u ${min}min` : `${h}u`;
  }
  return `${m} min`;
}

export function formatDistance(value, unit) {
  if (!value) return '—';
  if (unit === 'm') return `${Math.round(value)}m`;
  return `${value} ${unit}`;
}

export function calcPace(distanceKm, durationMinutes) {
  if (!distanceKm || !durationMinutes) return null;
  const paceMin = durationMinutes / distanceKm;
  const mins = Math.floor(paceMin);
  const secs = Math.round((paceMin - mins) * 60);
  return `${mins}:${String(secs).padStart(2, '0')} min/km`;
}

export function calcSpeed(distanceKm, durationMinutes) {
  if (!distanceKm || !durationMinutes) return null;
  const speed = distanceKm / (durationMinutes / 60);
  return `${speed.toFixed(1)} km/u`;
}

export function sportLabel(type) {
  const labels = { zwemmen: 'Zwemmen', fietsen: 'Fietsen', hardlopen: 'Hardlopen' };
  return labels[type] || type;
}

export function sportEmoji(type) {
  const icons = { zwemmen: '🏊', fietsen: '🚴', hardlopen: '🏃' };
  return icons[type] || '🏋️';
}

export function sportColor(type) {
  const colors = {
    zwemmen: 'text-blue-400 bg-blue-950 border-blue-800',
    fietsen: 'text-emerald-400 bg-emerald-950 border-emerald-800',
    hardlopen: 'text-orange-400 bg-orange-950 border-orange-800',
  };
  return colors[type] || 'text-slate-400 bg-slate-800 border-slate-700';
}

export function statusLabel(status) {
  const labels = { done: 'Gedaan', partial: 'Deels gedaan', skipped: 'Overgeslagen', planned: 'Gepland' };
  return labels[status] || status;
}

export function statusColor(status) {
  const colors = {
    done: 'text-emerald-400 bg-emerald-950',
    partial: 'text-yellow-400 bg-yellow-950',
    skipped: 'text-red-400 bg-red-950',
    planned: 'text-slate-400 bg-slate-800',
  };
  return colors[status] || 'text-slate-400 bg-slate-800';
}

export function feelingEmoji(feeling) {
  const icons = { green: '💚', orange: '🟠', red: '❤️‍🔥' };
  return icons[feeling] || '';
}

export function blockSummary(block, sport) {
  const dist = formatDistance(block.distance_value, block.distance_unit);
  const dur = formatDuration(block.duration_minutes);
  if (sport === 'hardlopen' && block.distance_unit === 'km') {
    const pace = calcPace(block.distance_value, block.duration_minutes);
    return pace ? `${dist} · ${dur} · ${pace}` : `${dist} · ${dur}`;
  }
  if (sport === 'fietsen' && block.distance_unit === 'km') {
    const speed = calcSpeed(block.distance_value, block.duration_minutes);
    return speed ? `${dist} · ${dur} · ${speed}` : `${dist} · ${dur}`;
  }
  return `${dist} · ${dur}`;
}

export function totalBlockDistance(blocks, unit) {
  return blocks.filter(b => b.distance_unit === unit).reduce((s, b) => s + (b.distance_value || 0), 0);
}

export function totalBlockDuration(blocks) {
  return blocks.reduce((s, b) => s + (b.duration_minutes || 0), 0);
}
