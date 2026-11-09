-- Plantillas de consentimiento informado y consentimientos firmados (texto congelado al firmar).

-- Datos del médico/consultorio que encabezan los consentimientos impresos (una sola fila)
CREATE TABLE consentimientos_consultorio (
  id    INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  datos JSONB NOT NULL DEFAULT '{}'
);
INSERT INTO consentimientos_consultorio (datos) VALUES ('{"doctor": "Dr. Alejandro Dodoli", "especialidad": "Cirujano Dentista"}');

CREATE TABLE consentimientos_plantillas (
  id         SERIAL PRIMARY KEY,
  titulo     VARCHAR(150) NOT NULL,
  texto      TEXT NOT NULL,
  firma_tutor BOOLEAN NOT NULL DEFAULT false,  -- la firma el padre/tutor (menores)
  activa     BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consentimientos_firmados (
  id           SERIAL PRIMARY KEY,
  paciente_id  INTEGER NOT NULL REFERENCES pacientes_pacientes(id) ON DELETE CASCADE,
  plantilla_id INTEGER REFERENCES consentimientos_plantillas(id) ON DELETE SET NULL,
  titulo       VARCHAR(150) NOT NULL,
  texto        TEXT NOT NULL,           -- ya con los datos del paciente; no cambia aunque cambie la plantilla
  encabezado   JSONB NOT NULL DEFAULT '{}', -- datos del consultorio al momento de firmar
  motivo       TEXT,
  firmante     VARCHAR(150) NOT NULL,
  parentesco   VARCHAR(60),
  firma        TEXT,                    -- PNG data URL; NULL = se imprimió para firmar en papel
  creado_por   INTEGER REFERENCES usuarios(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX consentimientos_paciente_idx ON consentimientos_firmados (paciente_id, created_at DESC);

INSERT INTO consentimientos_plantillas (titulo, firma_tutor, texto) VALUES
('Aceptación consentida — Odontopediatría (manejo de conducta)', true,
'Por este conducto acepto que mi hijo(a) {paciente} sea tratado(a) por {doctor} en {consultorio}, ubicada en {direccion}. Autorizo la toma de fotografías, radiografías y modelos de estudio de su cabeza, cuello y cavidad oral para los propósitos de diagnóstico, plan de tratamiento, educación científica y dental, y la publicación o demostración de las mismas de ser necesarias.

Autorizo también que sean aplicadas cualquiera de las siguientes técnicas de manejo de conducta: ELEVACIÓN EN EL TONO DE VOZ por parte del operador; COLOCACIÓN DE MANO SOBRE BOCA y/o el uso de RESTRICCIÓN FÍSICA (Pappoose Board o red), con el fin de que mi hijo(a) siga las indicaciones o explicaciones que le hace el doctor, buscando y garantizando la cooperación, seguridad e integridad física del niño(a) durante el tratamiento dental que solicité en esta clínica.

Me obligo, en caso de modificación del tratamiento y/o presupuesto inicial por factores imprevistos que se descubran durante el desarrollo del tratamiento, o bien en caso de cancelación de tratamientos por no convenir a mis intereses, a pagar totalmente los gastos que me presente el médico responsable según el número de citas atendidas y gastos ocasionados.

Todo lo anterior lo acepto incondicionalmente y de plena conformidad, ya que me fue ampliamente explicado, y en caso de alguna duda o queja puedo dirigirme al doctor responsable.'),
('Consentimiento informado — Tratamiento endodóntico', false,
'He sido adecuadamente informado(a) de que el tratamiento endodóntico está dirigido a preservar un diente que de otro modo debía ser extraído. Aunque este tratamiento tiene un índice de éxito elevado, sigue siendo un procedimiento biológico, por lo que no se puede garantizar un 100% de éxito; en ocasiones puede requerir un nuevo tratamiento, cirugía o incluso la extracción.

He sido informado(a) de que la restauración permanente (incrustación, corona u obturación) será realizada por mi dentista habitual y tendrá que realizarse dentro de los siguientes 15 días; de no ser así, se perderá la garantía de la endodoncia.

Asimismo, que tendré que acudir después de los 6 meses, al primer año y al segundo año a mis radiografías de control.

Presupuesto: toda consulta inicial tiene un costo de $300.00 (trescientos pesos 00/100 M.N.).');
