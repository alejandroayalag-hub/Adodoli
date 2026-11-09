-- Citas. Depende de pacientes_pacientes (MODULOS=pacientes,agenda,...).

CREATE TABLE agenda_citas (
  id           SERIAL PRIMARY KEY,
  paciente_id  INTEGER NOT NULL REFERENCES pacientes_pacientes(id),
  inicio       TIMESTAMPTZ NOT NULL,
  duracion_min SMALLINT NOT NULL DEFAULT 30 CHECK (duracion_min BETWEEN 5 AND 480),
  motivo       TEXT,
  estado       VARCHAR(12) NOT NULL DEFAULT 'programada'
               CHECK (estado IN ('programada', 'confirmada', 'atendida', 'cancelada', 'no_asistio')),
  notas        TEXT,
  creado_por   INTEGER REFERENCES usuarios(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX agenda_citas_inicio_idx ON agenda_citas (inicio);
CREATE INDEX agenda_citas_paciente_idx ON agenda_citas (paciente_id, inicio DESC);
