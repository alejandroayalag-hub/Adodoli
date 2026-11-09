// Rutas de finanzas, montadas en /api/finanzas.
const router = require('express').Router();
const pool = require('../../src/db/pool');

const TIPOS = ['ingreso', 'egreso'];
const METODOS = ['efectivo', 'tarjeta', 'transferencia', 'otro'];
const fallo = (res, status, error) => res.status(status).json({ error });
const texto = (v) => (typeof v === 'string' ? v.trim() || null : v ?? null);
// Con el módulo pacientes instalado se agrega el nombre del paciente a cada movimiento
const conPacientes = (process.env.MODULOS || '').split(',').map(s => s.trim()).includes('pacientes');
const PACIENTE = conPacientes
  ? `(SELECT p.nombre || coalesce(' ' || p.apellidos, '') FROM pacientes_pacientes p WHERE p.id = m.paciente_id)`
  : 'NULL';
const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

// ?mes=YYYY-MM o ?paciente_id=
router.get('/movimientos', async (req, res) => {
  const { mes, paciente_id } = req.query;
  if (paciente_id) {
    const { rows } = await pool.query('SELECT * FROM finanzas_movimientos WHERE paciente_id = $1 ORDER BY fecha DESC, id DESC', [paciente_id]);
    return res.json(rows);
  }
  if (!/^\d{4}-\d{2}$/.test(mes || '')) return fallo(res, 400, 'mes requerido (YYYY-MM)');
  const desde = `${mes}-01`;
  const [{ rows: movimientos }, { rows: categorias }] = await Promise.all([
    pool.query(
      `SELECT m.*, u.nombre AS creado_por_nombre, ${PACIENTE} AS paciente_nombre FROM finanzas_movimientos m LEFT JOIN usuarios u ON u.id = m.creado_por
       WHERE m.fecha >= $1::date AND m.fecha < $1::date + interval '1 month' ORDER BY m.fecha DESC, m.id DESC`, [desde]),
    pool.query(
      `SELECT tipo, categoria, sum(monto) AS total FROM finanzas_movimientos
       WHERE fecha >= $1::date AND fecha < $1::date + interval '1 month' GROUP BY tipo, categoria ORDER BY total DESC`, [desde]),
  ]);
  const suma = (t) => movimientos.filter(m => m.tipo === t).reduce((s, m) => s + Number(m.monto), 0);
  const ingresos = suma('ingreso'), egresos = suma('egreso');
  res.json({ movimientos, categorias, ingresos, egresos, balance: ingresos - egresos });
});

// Categorías ya usadas, para sugerir en el formulario
router.get('/categorias', async (req, res) => {
  const { rows } = await pool.query('SELECT DISTINCT tipo, categoria FROM finanzas_movimientos ORDER BY categoria');
  res.json(rows);
});

function datosMovimiento(b) {
  if (!TIPOS.includes(b.tipo)) return [null, 'Tipo inválido'];
  if (!b.concepto?.trim()) return [null, 'Concepto requerido'];
  const monto = Number(b.monto);
  if (!(monto > 0) || monto > 99999999) return [null, 'Monto inválido'];
  if (b.metodo && !METODOS.includes(b.metodo)) return [null, 'Método inválido'];
  if (b.fecha && !/^\d{4}-\d{2}-\d{2}$/.test(b.fecha)) return [null, 'Fecha inválida'];
  return [[b.tipo, b.fecha || hoy(), b.concepto.trim(), texto(b.categoria) || 'General', monto, b.metodo || 'efectivo',
    b.paciente_id || null, b.cita_id || null, texto(b.notas)]];
}

router.post('/movimientos', async (req, res) => {
  const [m, error] = datosMovimiento(req.body);
  if (error) return fallo(res, 400, error);
  const { rows: [nuevo] } = await pool.query(
    `INSERT INTO finanzas_movimientos (tipo, fecha, concepto, categoria, monto, metodo, paciente_id, cita_id, notas, creado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`, [...m, req.user.id]);
  res.status(201).json(nuevo);
});

router.put('/movimientos/:id', async (req, res) => {
  const [m, error] = datosMovimiento(req.body);
  if (error) return fallo(res, 400, error);
  const { rows: [act] } = await pool.query(
    `UPDATE finanzas_movimientos SET tipo = $1, fecha = $2, concepto = $3, categoria = $4, monto = $5, metodo = $6,
       paciente_id = $7, cita_id = $8, notas = $9 WHERE id = $10 RETURNING *`, [...m, req.params.id]);
  if (!act) return fallo(res, 404, 'Movimiento no encontrado');
  res.json(act);
});

router.delete('/movimientos/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM finanzas_movimientos WHERE id = $1', [req.params.id]);
  if (!rowCount) return fallo(res, 404, 'Movimiento no encontrado');
  res.json({ ok: true });
});

module.exports = router;
