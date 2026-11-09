// Usuarios de la instancia y a qué módulos entra cada uno (solo admin)
const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { requireRol } = require('../middleware/roles');
const modulos = require('../modulos');

const CLAVES = modulos.map(m => m.clave);
const COLUMNAS = 'id, nombre, email, rol, modulos, activo, created_at';
const temporal = () => crypto.randomBytes(9).toString('base64url');

function validar({ rol, modulos: mods }) {
  if (rol !== undefined && !['admin', 'usuario'].includes(rol)) return 'Rol inválido';
  if (mods !== undefined && (!Array.isArray(mods) || mods.some(m => !CLAVES.includes(m)))) return 'Módulo inválido';
  return null;
}

router.use(requireRol('admin'));

router.get('/', async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM usuarios ORDER BY nombre`);
  res.json(rows);
});

// Se crea con contraseña temporal que se muestra una sola vez; se cambia al entrar
router.post('/', async (req, res) => {
  const { nombre, email, rol = 'usuario', modulos: mods = [] } = req.body;
  if (!nombre?.trim() || !email?.trim()) return res.status(400).json({ error: 'Nombre y correo requeridos' });
  const error = validar({ rol, modulos: mods });
  if (error) return res.status(400).json({ error });
  const password = temporal();
  try {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol, modulos) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNAS}`,
      [nombre.trim(), email.trim().toLowerCase(), await bcrypt.hash(password, 10), rol, mods]);
    res.status(201).json({ ...rows[0], password_temporal: password });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ese correo ya está registrado' });
    throw e;
  }
});

router.put('/:id', async (req, res) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ error });
  if (Number(req.params.id) === req.user.id && (req.body.rol === 'usuario' || req.body.activo === false))
    return res.status(400).json({ error: 'No puedes quitarte el rol de admin ni desactivarte' });
  const campos = ['nombre', 'rol', 'modulos', 'activo'].filter(k => req.body[k] !== undefined);
  if (!campos.length) return res.status(400).json({ error: 'Nada que actualizar' });
  const { rows } = await pool.query(
    `UPDATE usuarios SET ${campos.map((k, i) => `${k} = $${i + 1}`).join(', ')} WHERE id = $${campos.length + 1} RETURNING ${COLUMNAS}`,
    [...campos.map(k => req.body[k]), req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(rows[0]);
});

router.post('/:id/restablecer', async (req, res) => {
  const password = temporal();
  const { rowCount } = await pool.query(
    'UPDATE usuarios SET password = $1, debe_cambiar_password = true WHERE id = $2',
    [await bcrypt.hash(password, 10), req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ password_temporal: password });
});

module.exports = router;
