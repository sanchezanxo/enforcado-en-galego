-- Esquema MariaDB/MySQL. Mantéñase paralelo a schema.sqlite.sql.

CREATE TABLE IF NOT EXISTS partidas (
  id CHAR(36) PRIMARY KEY,
  nome VARCHAR(60) NOT NULL,
  fingerprint VARCHAR(64),
  puntos INT NOT NULL,
  palabras_total INT NOT NULL,
  palabras_acertadas INT NOT NULL,
  letras_correctas INT NOT NULL,
  letras_incorrectas INT NOT NULL,
  precision_pct TINYINT NOT NULL,
  vidas_iniciais TINYINT NOT NULL,
  vidas_restantes TINYINT NOT NULL,
  vitoria TINYINT DEFAULT 0,
  duracion_seg INT,
  inicio DATETIME NOT NULL,
  fin DATETIME,
  INDEX idx_partidas_inicio (inicio),
  INDEX idx_partidas_puntos (puntos),
  INDEX idx_partidas_fingerprint (fingerprint)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  endpoint VARCHAR(60) NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rl_ip_endpoint (ip, endpoint),
  INDEX idx_rl_creado (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
