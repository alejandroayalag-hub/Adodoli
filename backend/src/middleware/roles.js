const pool = require('../db/pool');

const requireRol = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol))
    return res.status(403).json({ error: 'Sin permisos' });
  next();
};

// Acceso a un módulo: admin entra a todos; usuario solo si lo tiene asignado.
// Se lee de la BD (no del token) para que quitar un permiso aplique de inmediato.
const requireModulo = (clave) => async (req, res, next) => {
  const { rows } = await pool.query('SELECT rol, modulos, activo FROM usuarios WHERE id = $1', [req.user.id]);
  const u = rows[0];
  if (!u || !u.activo) return res.status(401).json({ error: 'Usuario inactivo' });
  if (u.rol !== 'admin' && !u.modulos.includes(clave)) return res.status(403).json({ error: 'Sin acceso a este módulo' });
  req.user.rol = u.rol;
  next();
};

module.exports = { requireRol, requireModulo };
