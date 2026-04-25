import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

function formatTime(createdAt) {
  const d = new Date(createdAt);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef();
  const lastIdRef = useRef(null);
  const inputRef = useRef();

  const loadMessages = async (initial = false) => {
    try {
      const data = initial
        ? await api.messages.list()
        : await api.messages.list(lastIdRef.current);
      if (data.length > 0) {
        lastIdRef.current = data[data.length - 1].id;
        if (initial) {
          setMessages(data);
        } else {
          setMessages(prev => [...prev, ...data]);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadMessages(true);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(() => loadMessages(false), 3000);
    return () => clearInterval(interval);
  }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const body = text.trim();
    setText('');
    try {
      const msg = await api.messages.send(body);
      lastIdRef.current = msg.id;
      setMessages(prev => [...prev, msg]);
      setError('');
    } catch (err) {
      setText(body);
      setError(err.message || 'Versturen mislukt');
    }
    setSending(false);
    inputRef.current?.focus();
  };

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  messages.forEach(msg => {
    const date = new Date(msg.created_at).toDateString();
    if (date !== lastDate) {
      grouped.push({ type: 'date', date, id: `date-${msg.id}` });
      lastDate = date;
    }
    grouped.push({ type: 'message', ...msg });
  });

  const formatDayLabel = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return 'Vandaag';
    if (d.toDateString() === yesterday.toDateString()) return 'Gisteren';
    return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 shrink-0">
        <h1 className="font-bold text-white">💬 De Machines Chat</h1>
        <p className="text-xs text-slate-500 mt-0.5">Motiveer elkaar. Geniet ervan.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-2 pb-32">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-12">
            Nog geen berichten. Begin!
          </div>
        )}
        {grouped.map(item => {
          if (item.type === 'date') {
            return (
              <div key={item.id} className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-600 shrink-0">{formatDayLabel(item.date)}</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
            );
          }

          const isMe = item.sender_user_id === user.id;
          return (
            <div key={item.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {!isMe && (
                  <span className="text-xs text-slate-500 px-1">{item.sender_name}</span>
                )}
                <div className={`rounded-2xl px-4 py-2.5 ${
                  isMe
                    ? 'bg-orange-500 text-white rounded-tr-sm'
                    : 'bg-slate-800 text-slate-100 rounded-tl-sm'
                }`}>
                  <p className="text-sm leading-relaxed break-words">{item.body}</p>
                </div>
                <span className="text-xs text-slate-600 px-1">{formatTime(item.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {error && (
        <div className="fixed bottom-32 left-4 right-4 bg-red-900 text-red-200 text-sm px-4 py-2 rounded-xl z-40 text-center">
          {error}
        </div>
      )}
      <form
        onSubmit={send}
        className="fixed bottom-16 left-0 right-0 bg-slate-900 border-t border-slate-800 px-4 py-3 z-30"
      >
        <div className="max-w-lg mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
            enterKeyHint="send"
            placeholder="Schrijf iets..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-orange-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="bg-orange-500 disabled:bg-slate-700 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0"
          >
            ↑
          </button>
        </div>
      </form>
    </div>
  );
}
