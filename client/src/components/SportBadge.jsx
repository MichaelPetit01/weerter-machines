import { sportEmoji, sportLabel, sportColor } from '../utils';

export default function SportBadge({ type, size = 'sm' }) {
  const base = 'inline-flex items-center gap-1 rounded-full border font-medium';
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1' };
  return (
    <span className={`${base} ${sizes[size]} ${sportColor(type)}`}>
      <span>{sportEmoji(type)}</span>
      <span>{sportLabel(type)}</span>
    </span>
  );
}
