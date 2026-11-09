// Rutas de odontología, montadas en /api/odontologia.
const router = require('express').Router();
const pool = require('../../src/db/pool');

const fallo = (res, status, error) => res.status(status).json({ error });
const texto = (v) => (typeof v === 'string' ? v.trim() || null : null);
const METODOS = ['efectivo', 'tarjeta', 'transferencia', 'otro'];
const fechaOk = (f) => /^\d{4}-\d{2}-\d{2}$/.test(f || '');
const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

const HOJAS = `
  SELECT e.*, coalesce(a.abonos, '[]') AS abonos
  FROM odontologia_endodoncias e
  LEFT JOIN LATERAL (
    SELECT json_agg(json_build_object('id', m.id, 'fecha', m.fecha, 'monto', m.monto, 'metodo', m.metodo) ORDER BY m.fecha, m.id) AS abonos
    FROM finanzas_movimientos m WHERE m.endodoncia_id = e.id
  ) a ON true`;

router.get('/pacientes/:id', async (req, res) => {
  const [{ rows: [h] }, { rows: endodoncias }] = await Promise.all([
    pool.query(`SELECT h.datos, h.updated_at, u.nombre AS actualizado_por_nombre FROM odontologia_historia h
                LEFT JOIN usuarios u ON u.id = h.actualizado_por WHERE h.paciente_id = $1`, [req.params.id]),
    pool.query(`${HOJAS} WHERE e.paciente_id = $1 ORDER BY e.fecha DESC, e.id DESC`, [req.params.id]),
  ]);
  res.json({ historia: h || null, endodoncias });
});

router.put('/pacientes/:id/historia', async (req, res) => {
  const datos = req.body;
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return fallo(res, 400, 'Datos inválidos');
  if (JSON.stringify(datos).length > 50000) return fallo(res, 400, 'Historia demasiado grande');
  const { rows: [p] } = await pool.query('SELECT id FROM pacientes_pacientes WHERE id = $1', [req.params.id]);
  if (!p) return fallo(res, 404, 'Paciente no encontrado');
  const { rows: [h] } = await pool.query(
    `INSERT INTO odontologia_historia (paciente_id, datos, actualizado_por) VALUES ($1, $2, $3)
     ON CONFLICT (paciente_id) DO UPDATE SET datos = EXCLUDED.datos, actualizado_por = EXCLUDED.actualizado_por, updated_at = NOW()
     RETURNING *`, [p.id, datos, req.user.id]);
  res.json(h);
});

function datosHoja(b) {
  if (b.fecha && !fechaOk(b.fecha)) return [null, 'Fecha inválida'];
  const conductos = b.conductos && typeof b.conductos === 'object' && !Array.isArray(b.conductos) ? b.conductos : {};
  if (!Array.isArray(b.tratamientos ?? [])) return [null, 'Tratamientos inválidos'];
  const tratamientos = (b.tratamientos || [])
    .map(t => ({ concepto: texto(t?.concepto), costo: Number(t?.costo) || 0 }))
    .filter(t => t.concepto || t.costo);
  if (tratamientos.some(t => t.costo < 0 || t.costo > 9999999)) return [null, 'Costo inválido'];
  if (JSON.stringify(conductos).length > 20000) return [null, 'Conductos demasiado grandes'];
  return [[b.fecha || hoy(), texto(b.diente), texto(b.grapa), texto(b.diagnostico), texto(b.descripcion),
    texto(b.observaciones), conductos, JSON.stringify(tratamientos)]];
}

router.post('/endodoncias', async (req, res) => {
  const [d, error] = datosHoja(req.body);
  if (error) return fallo(res, 400, error);
  const { rows: [p] } = await pool.query('SELECT id FROM pacientes_pacientes WHERE id = $1', [req.body.paciente_id]);
  if (!p) return fallo(res, 404, 'Paciente no encontrado');
  const { rows: [e] } = await pool.query(
    `INSERT INTO odontologia_endodoncias (fecha, diente, grapa, diagnostico, descripcion, observaciones, conductos, tratamientos, paciente_id, creado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`, [...d, p.id, req.user.id]);
  res.status(201).json(e);
});

router.put('/endodoncias/:id', async (req, res) => {
  const [d, error] = datosHoja(req.body);
  if (error) return fallo(res, 400, error);
  const { rowCount } = await pool.query(
    `UPDATE odontologia_endodoncias SET fecha = $1, diente = $2, grapa = $3, diagnostico = $4, descripcion = $5,
       observaciones = $6, conductos = $7, tratamientos = $8 WHERE id = $9`, [...d, req.params.id]);
  if (!rowCount) return fallo(res, 404, 'Hoja no encontrada');
  res.json({ ok: true });
});

router.delete('/endodoncias/:id', async (req, res) => {
  const { rows: [a] } = await pool.query('SELECT 1 FROM finanzas_movimientos WHERE endodoncia_id = $1 LIMIT 1', [req.params.id]);
  if (a) return fallo(res, 409, 'La hoja tiene abonos; bórralos primero en Finanzas');
  const { rowCount } = await pool.query('DELETE FROM odontologia_endodoncias WHERE id = $1', [req.params.id]);
  if (!rowCount) return fallo(res, 404, 'Hoja no encontrada');
  res.json({ ok: true });
});

// Abono = ingreso en Finanzas ligado a la hoja y al paciente
router.post('/endodoncias/:id/abonos', async (req, res) => {
  const monto = Number(req.body.monto);
  if (!(monto > 0) || monto > 9999999) return fallo(res, 400, 'Monto inválido');
  const metodo = req.body.metodo || 'efectivo';
  if (!METODOS.includes(metodo)) return fallo(res, 400, 'Método inválido');
  if (req.body.fecha && !fechaOk(req.body.fecha)) return fallo(res, 400, 'Fecha inválida');
  const { rows: [e] } = await pool.query('SELECT id, paciente_id, diente FROM odontologia_endodoncias WHERE id = $1', [req.params.id]);
  if (!e) return fallo(res, 404, 'Hoja no encontrada');
  const { rows: [m] } = await pool.query(
    `INSERT INTO finanzas_movimientos (tipo, fecha, concepto, categoria, monto, metodo, paciente_id, endodoncia_id, creado_por)
     VALUES ('ingreso', $1, $2, 'Endodoncia', $3, $4, $5, $6, $7) RETURNING *`,
    [req.body.fecha || hoy(), `Abono endodoncia${e.diente ? ` diente ${e.diente}` : ''}`, monto, metodo, e.paciente_id, e.id, req.user.id]);
  res.status(201).json(m);
});

module.exports = router;
