-- Movimientos de dinero. paciente_id/cita_id opcionales (sin FK: finanzas funciona sin pacientes/agenda).

CREATE TABLE finanzas_movimientos (
  id          SERIAL PRIMARY KEY,
  tipo        VARCHAR(7) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  fecha       DATE NOT NULL,
  concepto    VARCHAR(200) NOT NULL,
  categoria   VARCHAR(60) NOT NULL DEFAULT 'General',
  monto       NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  metodo      VARCHAR(15) NOT NULL DEFAULT 'efectivo' CHECK (metodo IN ('efectivo', 'tarjeta', 'transferencia', 'otro')),
  paciente_id INTEGER,
  cita_id     INTEGER,
  notas       TEXT,
  creado_por  INTEGER REFERENCES usuarios(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX finanzas_mov_fecha_idx ON finanzas_movimientos (fecha);
CREATE INDEX finanzas_mov_paciente_idx ON finanzas_movimientos (paciente_id);
