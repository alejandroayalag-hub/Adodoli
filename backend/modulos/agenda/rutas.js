// Rutas de agenda, montadas en /api/agenda. Horas en America/Mexico_City.
const router = require('express').Router();
const pool = require('../../src/db/pool');

const ESTADOS = ['programada', 'confirmada', 'atendida', 'cancelada', 'no_asistio'];
const TZ = 'America/Mexico_City';
const fallo = (res, status, error) => res.status(status).json({ error });
const texto = (v) => (typeof v === 'string' ? v.trim() || null : v ?? null);
const esFecha = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');

const SELECT = `SELECT c.*, to_char(c.inicio AT TIME ZONE '${TZ}', 'YYYY-MM-DD"T"HH24:MI') AS inicio_local,
                p.nombre || coalesce(' ' || p.apellidos, '') AS paciente, p.telefono
                FROM agenda_citas c JOIN pacientes_pacientes p ON p.id = c.paciente_id`;

// ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD (inclusive) o ?paciente_id=
router.get('/citas', async (req, res) => {
  const { desde, hasta, paciente_id } = req.query;
  if (paciente_id) {
    const { rows } = await pool.query(`${SELECT} WHERE c.paciente_id = $1 ORDER BY c.inicio DESC`, [paciente_id]);
    return res.json(rows);
  }
  if (!esFecha(desde) || !esFecha(hasta)) return fallo(res, 400, 'desde y hasta requeridos (YYYY-MM-DD)');
  const { rows } = await pool.query(
    `${SELECT} WHERE c.inicio >= ($1::date)::timestamp AT TIME ZONE '${TZ}'
                 AND c.inicio <  ($2::date + 1)::timestamp AT TIME ZONE '${TZ}'
     ORDER BY c.inicio`, [desde, hasta]);
  res.json(rows);
});

// inicio llega como hora local "YYYY-MM-DDTHH:MM"
function datosCita(b) {
  if (!b.paciente_id) return [null, 'Paciente requerido'];
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(b.inicio || '')) return [null, 'Fecha y hora requeridas'];
  const dur = Number(b.duracion_min || 30);
  if (!(dur >= 5 && dur <= 480)) return [null, 'Duración inválida'];
  if (b.estado !== undefined && !ESTADOS.includes(b.estado)) return [null, 'Estado inválido'];
  return [[b.paciente_id, b.inicio, dur, texto(b.motivo), b.estado || 'programada', texto(b.notas)]];
}

// Aviso (no bloqueo) si se empalma con otra cita activa
async function empalmes(inicio, dur, excluirId = 0) {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM agenda_citas
     WHERE id <> $3 AND estado NOT IN ('cancelada', 'no_asistio')
       AND tstzrange(inicio, inicio + duracion_min * interval '1 minute')
        && tstzrange($1::timestamp AT TIME ZONE '${TZ}', $1::timestamp AT TIME ZONE '${TZ}' + $2 * interval '1 minute')`,
    [inicio, dur, excluirId]);
  return rows[0].n;
}

router.post('/citas', async (req, res) => {
  const [c, error] = datosCita(req.body);
  if (error) return fallo(res, 400, error);
  try {
    const { rows: [nueva] } = await pool.query(
      `INSERT INTO agenda_citas (paciente_id, inicio, duracion_min, motivo, estado, notas, creado_por)
       VALUES ($1, $2::timestamp AT TIME ZONE '${TZ}', $3, $4, $5, $6, $7) RETURNING id`, [...c, req.user.id]);
    res.status(201).json({ id: nueva.id, empalmes: await empalmes(c[1], c[2], nueva.id) });
  } catch (e) {
    if (e.code === '23503') return fallo(res, 400, 'Paciente no existe');
    throw e;
  }
});

router.put('/citas/:id', async (req, res) => {
  const [c, error] = datosCita(req.body);
  if (error) return fallo(res, 400, error);
  const { rows: [act] } = await pool.query(
    `UPDATE agenda_citas SET paciente_id = $1, inicio = $2::timestamp AT TIME ZONE '${TZ}', duracion_min = $3,
       motivo = $4, estado = $5, notas = $6 WHERE id = $7 RETURNING id`, [...c, req.params.id]);
  if (!act) return fallo(res, 404, 'Cita no encontrada');
  res.json({ id: act.id, empalmes: await empalmes(c[1], c[2], act.id) });
});

router.delete('/citas/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM agenda_citas WHERE id = $1', [req.params.id]);
  if (!rowCount) return fallo(res, 404, 'Cita no encontrada');
  res.json({ ok: true });
});

module.exports = router;
