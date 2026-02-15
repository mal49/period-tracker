CREATE TABLE IF NOT EXISTS push_schedules (
  id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  notify_at INTEGER NOT NULL,
  title TEXT DEFAULT 'HerDay Reminder',
  body TEXT DEFAULT 'Time to check your cycle!',
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_notify_at ON push_schedules(notify_at);
