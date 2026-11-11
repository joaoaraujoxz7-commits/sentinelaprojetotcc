CREATE TABLE users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'institutional')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  cpf TEXT UNIQUE,
  birth_date TEXT,
  phone TEXT,
  postal_code TEXT,
  state TEXT NOT NULL DEFAULT 'BA',
  city TEXT NOT NULL DEFAULT 'Salvador',
  neighborhood TEXT,
  address TEXT,
  institution TEXT,
  functional_id TEXT UNIQUE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_consent INTEGER NOT NULL DEFAULT 0,
  institutional_type TEXT,
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);
CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);

CREATE TABLE user_accessibility_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  text_scale INTEGER NOT NULL DEFAULT 100 CHECK (text_scale BETWEEN 80 AND 140),
  high_contrast INTEGER NOT NULL DEFAULT 0,
  reduce_motion INTEGER NOT NULL DEFAULT 0,
  screen_reader INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);

CREATE VIEW citizen_users AS
  SELECT id, name, email, cpf, phone, state, city, latitude, longitude, location_consent, created_at
  FROM users WHERE role = 'citizen';
CREATE VIEW institutional_users AS
  SELECT id, name, email, institution, functional_id, state, city, created_at
  FROM users WHERE role = 'institutional';

CREATE TABLE occurrences (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  priority TEXT NOT NULL DEFAULT 'Normal',
  evidence_name TEXT,
  evidence_type TEXT,
  evidence_data TEXT,
  contact_authorized INTEGER NOT NULL DEFAULT 0,
  anonymous INTEGER NOT NULL DEFAULT 0,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  city TEXT,
  state TEXT
);
CREATE INDEX occurrences_created_by_idx ON occurrences(created_by);

CREATE TABLE predictions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);
CREATE INDEX predictions_created_by_idx ON predictions(created_by);

CREATE TABLE audits (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);
CREATE INDEX audits_created_by_idx ON audits(created_by);

CREATE TABLE contests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  evidence_name TEXT,
  evidence_type TEXT,
  evidence_data TEXT
);
CREATE INDEX contests_created_by_idx ON contests(created_by);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);
CREATE INDEX reports_created_by_idx ON reports(created_by);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);
CREATE INDEX notifications_created_by_idx ON notifications(created_by);

CREATE TABLE patrols (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  result TEXT,
  recommendation_followed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX patrols_created_by_idx ON patrols(created_by);

CREATE TABLE recommendations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);
CREATE INDEX recommendations_created_by_idx ON recommendations(created_by);

CREATE TABLE ai_decisions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);
CREATE INDEX ai_decisions_created_by_idx ON ai_decisions(created_by);

CREATE TABLE bias_alerts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);
CREATE INDEX bias_alerts_created_by_idx ON bias_alerts(created_by);

CREATE TABLE mitigations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);
CREATE INDEX mitigations_created_by_idx ON mitigations(created_by);

CREATE TABLE models (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);
CREATE INDEX models_created_by_idx ON models(created_by);

CREATE TABLE data_quality (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS'),
  updated_at TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
);
CREATE INDEX data_quality_created_by_idx ON data_quality(created_by);
