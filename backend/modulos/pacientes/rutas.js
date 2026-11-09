// Rutas de pacientes, montadas en /api/pacientes.
const router = require('express').Router();
const pool = require('../../src/db/pool');

const fallo = (res, status, error) => res.status(status).json({ error });
// Búsqueda sin acentos ni mayúsculas, sin depender de la extensión unaccent
const plano = (sql) => `translate(lower(${sql}), 'áéíóúüñ', 'aeiouun')`;
const texto = (v) => (typeof v === 'string' ? v.trim() || null : v ?? null);

// q busca por nombre, apellidos o teléfono
router.get('/', async (req, res) => {
  const q = req.query.q?.trim();
  const { rows } = await pool.query(
    `SELECT id, nombre, apellidos, fecha_nacimiento, sexo, telefono, email, created_at
     FROM pacientes_pacientes
     WHERE activo AND ($1::text IS NULL OR ${plano("nombre || ' ' || coalesce(apellidos, '')")} LIKE ${plano('$2')} OR telefono LIKE $2)
     ORDER BY nombre, apellidos LIMIT 300`,
    [q || null, `%${q}%`]);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows: [p] } = await pool.query(
    `SELECT p.*, a.datos AS antecedentes, a.updated_at AS antecedentes_actualizados, u.nombre AS antecedentes_por
     FROM pacientes_pacientes p
     LEFT JOIN pacientes_antecedentes a ON a.paciente_id = p.id
     LEFT JOIN usuarios u ON u.id = a.actualizado_por
     WHERE p.id = $1`, [req.params.id]);
  if (!p) return fallo(res, 404, 'Paciente no encontrado');
  res.json(p);
});

function datosPaciente(b) {
  if (!b.nombre?.trim()) return [null, 'Nombre requerido'];
  if (b.sexo && !['F', 'M'].includes(b.sexo)) return [null, 'Sexo inválido'];
  return [[b.nombre.trim(), texto(b.apellidos), b.fecha_nacimiento || null, b.sexo || null,
    texto(b.telefono), texto(b.email), texto(b.direccion), texto(b.notas)]];
}

router.post('/', async (req, res) => {
  const [p, error] = datosPaciente(req.body);
  if (error) return fallo(res, 400, error);
  const { rows: [nuevo] } = await pool.query(
    `INSERT INTO pacientes_pacientes (nombre, apellidos, fecha_nacimiento, sexo, telefono, email, direccion, notas)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, p);
  res.status(201).json(nuevo);
});

router.put('/:id', async (req, res) => {
  const [p, error] = datosPaciente(req.body);
  if (error) return fallo(res, 400, error);
  const { rows: [act] } = await pool.query(
    `UPDATE pacientes_pacientes SET nombre = $1, apellidos = $2, fecha_nacimiento = $3, sexo = $4,
       telefono = $5, email = $6, direccion = $7, notas = $8
     WHERE id = $9 RETURNING *`, [...p, req.params.id]);
  if (!act) return fallo(res, 404, 'Paciente no encontrado');
  res.json(act);
});

// Baja lógica: conserva historial, citas y pagos
router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query('UPDATE pacientes_pacientes SET activo = false WHERE id = $1', [req.params.id]);
  if (!rowCount) return fallo(res, 404, 'Paciente no encontrado');
  res.json({ ok: true });
});

router.put('/:id/antecedentes', async (req, res) => {
  const datos = req.body;
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return fallo(res, 400, 'Datos inválidos');
  if (JSON.stringify(datos).length > 100000) return fallo(res, 400, 'Historia demasiado grande');
  const { rows: [p] } = await pool.query('SELECT id FROM pacientes_pacientes WHERE id = $1', [req.params.id]);
  if (!p) return fallo(res, 404, 'Paciente no encontrado');
  const { rows: [a] } = await pool.query(
    `INSERT INTO pacientes_antecedentes (paciente_id, datos, actualizado_por) VALUES ($1, $2, $3)
     ON CONFLICT (paciente_id) DO UPDATE SET datos = EXCLUDED.datos, actualizado_por = EXCLUDED.actualizado_por, updated_at = NOW()
     RETURNING *`, [p.id, datos, req.user.id]);
  res.json(a);
});

module.exports = router;
