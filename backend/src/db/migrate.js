const fs = require('fs');
const path = require('path');
const pool = require('./pool');
const modulos = require('../modulos');

// Aplica en orden: núcleo y luego cada módulo instalado. Se registran como "<origen>/<archivo>".
async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const origenes = [
    { clave: 'nucleo', dir: path.join(__dirname, 'migrations') },
    ...modulos.map(m => ({ clave: m.clave, dir: m.migraciones })),
  ];

  for (const { clave, dir } of origenes) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
      const nombre = `${clave}/${file}`;
      const { rows } = await pool.query('SELECT 1 FROM _migrations WHERE filename=$1', [nombre]);
      if (rows.length) continue;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [nombre]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migración ${nombre}: ${err.message}`);
      } finally {
        client.release();
      }
      console.log(`Migración aplicada: ${nombre}`);
    }
  }
}

module.exports = runMigrations;
