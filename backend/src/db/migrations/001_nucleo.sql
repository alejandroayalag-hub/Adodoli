-- Núcleo de la plataforma: usuarios y a qué módulos entra cada uno

CREATE TABLE usuarios (
  id                    SERIAL PRIMARY KEY,
  email                 VARCHAR(150) NOT NULL UNIQUE,
  password              VARCHAR(255) NOT NULL,
  nombre                VARCHAR(100) NOT NULL,
  rol                   VARCHAR(20) NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
  modulos               TEXT[] NOT NULL DEFAULT '{}',  -- admin entra a todos; usuario solo a estos
  activo                BOOLEAN NOT NULL DEFAULT true,
  debe_cambiar_password BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
