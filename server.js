const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads dir exists
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads', 'selfies');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'weerter-machines-geheim-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true },
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `selfie_${Date.now()}_${req.session.userId}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

const auth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Niet ingelogd' });
  next();
};

// ─── AUTH ────────────────────────────────────────────────────────────────────

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = db.prepare('SELECT id, username, display_name FROM users WHERE id = ?').get(req.session.userId);
  res.json({ user: user || null });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username?.trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Verkeerde gebruikersnaam of wachtwoord' });
  }
  req.session.userId = user.id;
  res.json({ user: { id: user.id, username: user.username, display_name: user.display_name } });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// ─── TRAININGS ───────────────────────────────────────────────────────────────

function enrichTraining(t) {
  const blocks = db.prepare('SELECT * FROM training_blocks WHERE training_id = ? ORDER BY order_index').all(t.id);
  const logs = db.prepare(`
    SELECT tl.*, u.display_name FROM training_logs tl
    JOIN users u ON tl.user_id = u.id WHERE tl.training_id = ?
  `).all(t.id);
  return { ...t, blocks, logs };
}

app.get('/api/trainings', auth, (req, res) => {
  const { weekStart } = req.query;
  let rows;
  if (weekStart) {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const weekEnd = end.toISOString().split('T')[0];
    rows = db.prepare('SELECT * FROM trainings WHERE date BETWEEN ? AND ? ORDER BY date, created_at').all(weekStart, weekEnd);
  } else {
    rows = db.prepare('SELECT * FROM trainings ORDER BY date, created_at').all();
  }
  res.json(rows.map(enrichTraining));
});

app.get('/api/trainings/next', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const row = db.prepare('SELECT * FROM trainings WHERE date >= ? ORDER BY date ASC, created_at ASC LIMIT 1').get(today);
  res.json(row ? enrichTraining(row) : null);
});

app.post('/api/trainings', auth, (req, res) => {
  const { date, title, description, sport_type, is_extra, blocks } = req.body;
  const r = db.prepare(`
    INSERT INTO trainings (date, title, description, sport_type, is_extra, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(date, title, description || '', sport_type, is_extra ? 1 : 0, req.session.userId);

  const tid = r.lastInsertRowid;
  if (blocks?.length) {
    const ins = db.prepare('INSERT INTO training_blocks (training_id, order_index, distance_value, distance_unit, duration_minutes) VALUES (?, ?, ?, ?, ?)');
    blocks.forEach((b, i) => ins.run(tid, i, b.distance_value, b.distance_unit, b.duration_minutes));
  }
  res.json(enrichTraining(db.prepare('SELECT * FROM trainings WHERE id = ?').get(tid)));
});

app.put('/api/trainings/:id', auth, (req, res) => {
  const { date, title, description, sport_type, is_extra, blocks } = req.body;
  const { id } = req.params;
  db.prepare(`
    UPDATE trainings SET date=?, title=?, description=?, sport_type=?, is_extra=?, updated_at=datetime('now') WHERE id=?
  `).run(date, title, description || '', sport_type, is_extra ? 1 : 0, id);

  db.prepare('DELETE FROM training_blocks WHERE training_id = ?').run(id);
  if (blocks?.length) {
    const ins = db.prepare('INSERT INTO training_blocks (training_id, order_index, distance_value, distance_unit, duration_minutes) VALUES (?, ?, ?, ?, ?)');
    blocks.forEach((b, i) => ins.run(id, i, b.distance_value, b.distance_unit, b.duration_minutes));
  }
  res.json(enrichTraining(db.prepare('SELECT * FROM trainings WHERE id = ?').get(id)));
});

app.delete('/api/trainings/:id', auth, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM training_blocks WHERE training_id = ?').run(id);
  db.prepare('DELETE FROM training_logs WHERE training_id = ?').run(id);
  db.prepare('DELETE FROM trainings WHERE id = ?').run(id);
  res.json({ ok: true });
});

// ─── TRAINING LOGS ───────────────────────────────────────────────────────────

app.get('/api/trainings/:id/log', auth, (req, res) => {
  const log = db.prepare('SELECT * FROM training_logs WHERE training_id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);
  res.json(log || null);
});

app.post('/api/trainings/:id/log', auth, (req, res) => {
  const { status, actual_distance, actual_duration, actual_pace_or_speed, effort_score, feeling_status, evaluation_text, message_to_other, selfie_url } = req.body;
  const { id } = req.params;
  const uid = req.session.userId;
  const existing = db.prepare('SELECT id FROM training_logs WHERE training_id = ? AND user_id = ?').get(id, uid);

  if (existing) {
    db.prepare(`
      UPDATE training_logs SET
        status=?, actual_distance=?, actual_duration=?, actual_pace_or_speed=?,
        effort_score=?, feeling_status=?, evaluation_text=?, message_to_other=?,
        selfie_url=COALESCE(?, selfie_url),
        completed_at=CASE WHEN ? IN ('done','partial') AND completed_at IS NULL THEN datetime('now') ELSE completed_at END
      WHERE training_id=? AND user_id=?
    `).run(status, actual_distance, actual_duration, actual_pace_or_speed,
           effort_score, feeling_status, evaluation_text || '', message_to_other || '',
           selfie_url || null, status, id, uid);
  } else {
    db.prepare(`
      INSERT INTO training_logs (training_id, user_id, status, actual_distance, actual_duration, actual_pace_or_speed, effort_score, feeling_status, evaluation_text, message_to_other, selfie_url, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? IN ('done','partial') THEN datetime('now') ELSE NULL END)
    `).run(id, uid, status, actual_distance, actual_duration, actual_pace_or_speed,
           effort_score, feeling_status, evaluation_text || '', message_to_other || '',
           selfie_url || null, status);
  }

  res.json(db.prepare('SELECT * FROM training_logs WHERE training_id = ? AND user_id = ?').get(id, uid));
});

app.post('/api/trainings/:id/selfie', auth, upload.single('selfie'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Geen bestand ontvangen' });
  const selfie_url = `/uploads/selfies/${req.file.filename}`;
  const { id } = req.params;
  const uid = req.session.userId;

  const existing = db.prepare('SELECT id FROM training_logs WHERE training_id = ? AND user_id = ?').get(id, uid);
  if (existing) {
    db.prepare('UPDATE training_logs SET selfie_url = ? WHERE training_id = ? AND user_id = ?').run(selfie_url, id, uid);
  } else {
    db.prepare('INSERT INTO training_logs (training_id, user_id, status, selfie_url) VALUES (?, ?, ?, ?)').run(id, uid, 'planned', selfie_url);
  }
  res.json({ selfie_url });
});

// ─── MESSAGES ────────────────────────────────────────────────────────────────

app.get('/api/messages', auth, (req, res) => {
  const { since } = req.query;
  const q = since
    ? 'SELECT m.*, u.display_name as sender_name FROM messages m JOIN users u ON m.sender_user_id = u.id WHERE m.id > ? ORDER BY m.created_at ASC'
    : 'SELECT m.*, u.display_name as sender_name FROM messages m JOIN users u ON m.sender_user_id = u.id ORDER BY m.created_at ASC';
  res.json(since ? db.prepare(q).all(since) : db.prepare(q).all());
});

app.post('/api/messages', auth, (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Leeg bericht' });
  const r = db.prepare('INSERT INTO messages (sender_user_id, body) VALUES (?, ?)').run(req.session.userId, body.trim());
  const msg = db.prepare('SELECT m.*, u.display_name as sender_name FROM messages m JOIN users u ON m.sender_user_id = u.id WHERE m.id = ?').get(r.lastInsertRowid);
  res.json(msg);
});

// ─── STATS ───────────────────────────────────────────────────────────────────

app.get('/api/stats', auth, (req, res) => {
  const users = db.prepare('SELECT id, display_name FROM users').all();
  const stats = users.map(u => {
    const logs = db.prepare(`
      SELECT tl.*, t.sport_type FROM training_logs tl
      JOIN trainings t ON tl.training_id = t.id
      WHERE tl.user_id = ? AND tl.status IN ('done', 'partial')
    `).all(u.id);

    const sum = (sport, field) => logs.filter(l => l.sport_type === sport).reduce((s, l) => s + (l[field] || 0), 0);
    const efforts = logs.filter(l => l.effort_score).map(l => l.effort_score);

    return {
      user_id: u.id,
      display_name: u.display_name,
      swim_distance: Math.round(sum('zwemmen', 'actual_distance')),
      bike_distance: +sum('fietsen', 'actual_distance').toFixed(1),
      run_distance: +sum('hardlopen', 'actual_distance').toFixed(1),
      completed: logs.filter(l => l.status === 'done').length,
      partial: logs.filter(l => l.status === 'partial').length,
      avg_effort: efforts.length ? +(efforts.reduce((a, b) => a + b, 0) / efforts.length).toFixed(1) : null,
    };
  });
  res.json(stats);
});

// ─── WEEK SUMMARY ────────────────────────────────────────────────────────────

app.get('/api/week-summary', auth, (req, res) => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today); monday.setDate(diff);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const weekStart = monday.toISOString().split('T')[0];
  const weekEnd = sunday.toISOString().split('T')[0];

  const trainings = db.prepare('SELECT id FROM trainings WHERE date BETWEEN ? AND ?').all(weekStart, weekEnd);
  const users = db.prepare('SELECT id, display_name FROM users').all();

  const userStats = users.map(u => {
    const done = db.prepare(`
      SELECT COUNT(*) as count FROM training_logs
      WHERE training_id IN (SELECT id FROM trainings WHERE date BETWEEN ? AND ?)
      AND user_id = ? AND status IN ('done','partial')
    `).get(weekStart, weekEnd, u.id);
    return { user_id: u.id, display_name: u.display_name, completed: done.count };
  });

  res.json({ total_planned: trainings.length, week_start: weekStart, week_end: weekEnd, users: userStats });
});

// ─── PRODUCTION STATIC ───────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`🚀 De Weerter Machines draaien op http://localhost:${PORT}`);
});
