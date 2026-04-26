-- Esquema SQLite. Mantéñase paralelo a schema.mariadb.sql.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS partidas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  fingerprint TEXT,
  puntos INTEGER NOT NULL,
  palabras_total INTEGER NOT NULL,
  palabras_acertadas INTEGER NOT NULL,
  letras_correctas INTEGER NOT NULL,
  letras_incorrectas INTEGER NOT NULL,
  precision_pct INTEGER NOT NULL,
  vidas_iniciais INTEGER NOT NULL,
  vidas_restantes INTEGER NOT NULL,
  vitoria INTEGER DEFAULT 0,
  duracion_seg INTEGER,
  inicio TEXT NOT NULL,
  fin TEXT
);
CREATE INDEX IF NOT EXISTS idx_partidas_inicio ON partidas(inicio);
CREATE INDEX IF NOT EXISTS idx_partidas_puntos ON partidas(puntos DESC);
CREATE INDEX IF NOT EXISTS idx_partidas_fingerprint ON partidas(fingerprint);

CREATE TABLE IF NOT EXISTS rate_limit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  creado_en TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rl_ip_endpoint ON rate_limit(ip, endpoint);
CREATE INDEX IF NOT EXISTS idx_rl_creado ON rate_limit(creado_en);
