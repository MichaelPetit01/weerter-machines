const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS trainings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    sport_type TEXT NOT NULL,
    is_extra INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS training_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    training_id INTEGER NOT NULL REFERENCES trainings(id),
    order_index INTEGER DEFAULT 0,
    distance_value REAL,
    distance_unit TEXT,
    duration_minutes REAL,
    pace_or_speed_value REAL,
    pace_or_speed_unit TEXT
  );

  CREATE TABLE IF NOT EXISTS training_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    training_id INTEGER NOT NULL REFERENCES trainings(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'planned',
    actual_distance REAL,
    actual_duration REAL,
    actual_pace_or_speed REAL,
    effort_score INTEGER,
    feeling_status TEXT,
    evaluation_text TEXT DEFAULT '',
    message_to_other TEXT DEFAULT '',
    selfie_url TEXT,
    completed_at TEXT,
    UNIQUE(training_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_user_id INTEGER NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;
