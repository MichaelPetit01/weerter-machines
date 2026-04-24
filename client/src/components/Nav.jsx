export default function Nav({ active, onChange }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'week', label: 'Week', icon: '📅' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'stats', label: 'Stats', icon: '📊' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-40 safe-bottom">
      <div className="flex max-w-lg mx-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${
              active === tab.id
                ? 'text-orange-400'
                : 'text-slate-500 active:text-slate-300'
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
