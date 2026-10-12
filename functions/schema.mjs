export const schema = `
CREATE TABLE IF NOT EXISTS vireli_users (
  id UUID PRIMARY KEY, username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, password_salt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vireli_sessions (
  token_hash TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES vireli_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS vireli_devices (
  token_hash TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vireli_device_accounts (
  device_hash TEXT NOT NULL REFERENCES vireli_devices(token_hash),
  user_id UUID NOT NULL REFERENCES vireli_users(id) ON DELETE CASCADE,
  PRIMARY KEY (device_hash, user_id)
);
CREATE TABLE IF NOT EXISTS vireli_planners (
  user_id UUID PRIMARY KEY REFERENCES vireli_users(id) ON DELETE CASCADE,
  document JSONB NOT NULL, revision INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vireli_rate_limits (
  key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, reset_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS vireli_sessions_expiry ON vireli_sessions(expires_at);
`;
