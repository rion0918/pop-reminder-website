CREATE TABLE IF NOT EXISTS waitlist_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id_hash TEXT NOT NULL UNIQUE CHECK (length(client_id_hash) = 64),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS waitlist_signups_created_at_idx
  ON waitlist_signups (created_at);

CREATE INDEX IF NOT EXISTS waitlist_signups_campaign_idx
  ON waitlist_signups (utm_source, utm_medium, utm_campaign);
