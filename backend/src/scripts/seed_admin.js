// Uso: node src/scripts/seed_admin.js <email> "<Nombre>"
// Crea un admin con contraseña temporal aleatoria (debe cambiarla al entrar).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

async function seed() {
  const [email, nombre] = process.argv.slice(2);
  if (!email || !nombre) throw new Error('Uso: node src/scripts/seed_admin.js <email> "<Nombre>"');
  const temporal = crypto.randomBytes(9).toString('base64url');
  const { rowCount } = await pool.query(
    `INSERT INTO usuarios (email, password, nombre, rol, debe_cambiar_password)
     VALUES ($1, $2, $3, 'admin', true)
     ON CONFLICT (email) DO NOTHING`,
    [email, await bcrypt.hash(temporal, 10), nombre]
  );
  console.log(rowCount ? `✓ ${email} / ${temporal} (temporal)` : `= ${email} ya existe`);
  await pool.end();
}

seed().catch(err => { console.error(err.message); process.exit(1); });
