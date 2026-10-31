-- Failed logins per key (account + client address), shared by every server instance and process, so the brake on
-- password guessing still holds when the backend runs several times behind Render's load balancer.
-- The key is stored as a SHA-256 hash (fixed length, no customer numbers or names in this table).
-- Only adds a table; until it exists, the backend keeps counting in memory as before.
CREATE TABLE IF NOT EXISTS login_failures (
  key       text PRIMARY KEY,
  first_at  timestamptz NOT NULL DEFAULT now(),   -- start of the current 15-minute window
  count     integer NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS login_failures_first_idx ON login_failures (first_at);
