-- Pacientes y sus antecedentes médicos.

CREATE TABLE pacientes_pacientes (
  id               SERIAL PRIMARY KEY,
  nombre           VARCHAR(100) NOT NULL,
  apellidos        VARCHAR(150),
  fecha_nacimiento DATE,
  sexo             CHAR(1) CHECK (sexo IN ('F', 'M')),
  telefono         VARCHAR(30),
  email            VARCHAR(150),
  direccion        TEXT,
  notas            TEXT,
  activo           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- ponytail: búsqueda con LIKE sin índice; agregar pg_trgm si pasan de ~50 mil pacientes

-- ponytail: antecedentes en un JSONB (secciones del formulario); columnas si algún día se reporta por campo
CREATE TABLE pacientes_antecedentes (
  paciente_id    INTEGER PRIMARY KEY REFERENCES pacientes_pacientes(id) ON DELETE CASCADE,
  datos          JSONB NOT NULL DEFAULT '{}',
  actualizado_por INTEGER REFERENCES usuarios(id),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
