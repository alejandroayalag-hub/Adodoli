// Rutas de consentimientos, montadas en /api/consentimientos.
const router = require('express').Router();
const pool = require('../../src/db/pool');
const { requireRol } = require('../../src/middleware/roles');

const fallo = (res, status, error) => res.status(status).json({ error });
const texto = (v) => (typeof v === 'string' ? v.trim() || null : null);
const soloAdmin = requireRol('admin');
const CAMPOS_CONSULTORIO = ['doctor', 'especialidad', 'cedula_prof', 'cedula_esp', 'consultorio', 'direccion', 'telefono'];

const consultorio = async () => (await pool.query('SELECT datos FROM consentimientos_consultorio WHERE id = 1')).rows[0]?.datos || {};

function edad(fn) {
  if (!fn) return '';
  const n = new Date(fn), h = new Date();
  return String(h.getFullYear() - n.getFullYear() - (h < new Date(h.getFullYear(), n.getMonth(), n.getDate()) ? 1 : 0));
}
// {campo} → dato; las llaves desconocidas se dejan tal cual para que se note
const rellenar = (t, d) => t.replace(/\{(\w+)\}/g, (m, k) => (k in d ? d[k] || '________' : m));

router.get('/consultorio', async (req, res) => res.json(await consultorio()));
router.put('/consultorio', soloAdmin, async (req, res) => {
  const datos = Object.fromEntries(CAMPOS_CONSULTORIO.map(k => [k, texto(req.body[k])]));
  await pool.query('UPDATE consentimientos_consultorio SET datos = $1 WHERE id = 1', [datos]);
  res.json(datos);
});

router.get('/plantillas', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM consentimientos_plantillas ORDER BY activa DESC, titulo');
  res.json(rows);
});

function datosPlantilla(b) {
  if (!texto(b.titulo)) return [null, 'Título requerido'];
  if (!texto(b.texto)) return [null, 'Texto requerido'];
  if (b.texto.length > 30000) return [null, 'Texto demasiado largo'];
  return [[texto(b.titulo), b.texto.trim(), !!b.firma_tutor, b.activa !== false]];
}
router.post('/plantillas', soloAdmin, async (req, res) => {
  const [d, error] = datosPlantilla(req.body);
  if (error) return fallo(res, 400, error);
  const { rows: [p] } = await pool.query(
    'INSERT INTO consentimientos_plantillas (titulo, texto, firma_tutor, activa) VALUES ($1, $2, $3, $4) RETURNING *', d);
  res.status(201).json(p);
});
router.put('/plantillas/:id', soloAdmin, async (req, res) => {
  const [d, error] = datosPlantilla(req.body);
  if (error) return fallo(res, 400, error);
  const { rows: [p] } = await pool.query(
    'UPDATE consentimientos_plantillas SET titulo = $1, texto = $2, firma_tutor = $3, activa = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
    [...d, req.params.id]);
  if (!p) return fallo(res, 404, 'Plantilla no encontrada');
  res.json(p);
});

router.get('/pacientes/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, u.nombre AS creado_por_nombre FROM consentimientos_firmados c LEFT JOIN usuarios u ON u.id = c.creado_por
     WHERE c.paciente_id = $1 ORDER BY c.created_at DESC`, [req.params.id]);
  res.json(rows);
});

// Congela el texto con los datos del paciente y del consultorio de hoy
router.post('/pacientes/:id', async (req, res) => {
  const b = req.body;
  if (!texto(b.firmante)) return fallo(res, 400, 'Nombre de quien firma requerido');
  if (b.firma && !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(b.firma)) return fallo(res, 400, 'Firma inválida');
  if (b.firma && b.firma.length > 1500000) return fallo(res, 400, 'Firma demasiado grande');
  const [{ rows: [p] }, { rows: [pl] }, enc] = await Promise.all([
    pool.query('SELECT * FROM pacientes_pacientes WHERE id = $1', [req.params.id]),
    pool.query('SELECT * FROM consentimientos_plantillas WHERE id = $1', [b.plantilla_id]),
    consultorio(),
  ]);
  if (!p) return fallo(res, 404, 'Paciente no encontrado');
  if (!pl) return fallo(res, 404, 'Plantilla no encontrada');
  const datos = {
    ...enc,
    paciente: [p.nombre, p.apellidos].filter(Boolean).join(' '),
    edad: edad(p.fecha_nacimiento),
    fecha: new Date().toLocaleDateString('es-MX', { dateStyle: 'long', timeZone: 'America/Mexico_City' }),
    tutor: texto(b.firmante),
    motivo: texto(b.motivo),
  };
  const { rows: [c] } = await pool.query(
    `INSERT INTO consentimientos_firmados (paciente_id, plantilla_id, titulo, texto, encabezado, motivo, firmante, parentesco, firma, creado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [p.id, pl.id, pl.titulo, rellenar(pl.texto, datos), enc, texto(b.motivo), texto(b.firmante), texto(b.parentesco), b.firma || null, req.user.id]);
  res.status(201).json(c);
});

// Un consentimiento firmado no se edita; solo admin lo puede anular (borrar)
router.delete('/firmados/:id', soloAdmin, async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM consentimientos_firmados WHERE id = $1', [req.params.id]);
  if (!rowCount) return fallo(res, 404, 'No encontrado');
  res.json({ ok: true });
});

module.exports = router;
