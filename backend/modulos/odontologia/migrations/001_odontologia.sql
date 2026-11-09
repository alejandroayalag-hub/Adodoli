-- Historia odontológica (formato "neo") y hojas de endodoncia. Depende de pacientes_pacientes y finanzas_movimientos.

-- ponytail: cuestionario en JSONB igual que antecedentes; columnas si algún día se reporta por pregunta
CREATE TABLE odontologia_historia (
  paciente_id     INTEGER PRIMARY KEY REFERENCES pacientes_pacientes(id) ON DELETE CASCADE,
  datos           JSONB NOT NULL DEFAULT '{}',
  actualizado_por INTEGER REFERENCES usuarios(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE odontologia_endodoncias (
  id            SERIAL PRIMARY KEY,
  paciente_id   INTEGER NOT NULL REFERENCES pacientes_pacientes(id) ON DELETE CASCADE,
  fecha         DATE NOT NULL,
  diente        VARCHAR(10),
  grapa         VARCHAR(40),
  diagnostico   TEXT,
  descripcion   TEXT,
  observaciones TEXT,
  conductos     JSONB NOT NULL DEFAULT '{}',   -- { "Mesiobucal": { mm, ref, laj, lm, tecnica }, ... }
  tratamientos  JSONB NOT NULL DEFAULT '[]',   -- [{ concepto, costo }]
  creado_por    INTEGER REFERENCES usuarios(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX odontologia_endo_paciente_idx ON odontologia_endodoncias (paciente_id, fecha DESC);

-- Abonos de cada hoja = ingresos de finanzas ligados a ella
ALTER TABLE finanzas_movimientos ADD COLUMN endodoncia_id INTEGER;
CREATE INDEX finanzas_mov_endodoncia_idx ON finanzas_movimientos (endodoncia_id);
