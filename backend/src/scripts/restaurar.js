// Restaura un respaldo sobre la base actual (BORRA lo que hay y deja lo del respaldo).
// Uso: detener la app y luego  node src/scripts/restaurar.js <ruta/al/respaldo_AAAA-MM-DD_HHMM.dump>
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { spawnSync } = require('child_process');

const archivo = process.argv[2];
if (!archivo) { console.error('Uso: node src/scripts/restaurar.js <archivo.dump>'); process.exit(1); }
// pg_restore vive junto a pg_dump (PG_DUMP puede ser ruta completa en Windows)
const pgRestore = (process.env.PG_DUMP || 'pg_dump').replace(/pg_dump(\.exe)?$/i, 'pg_restore$1');
const r = spawnSync(pgRestore,
  ['--clean', '--if-exists', '--no-owner', '-h', process.env.DB_HOST || 'localhost', '-p', String(process.env.DB_PORT || 5432),
    '-U', process.env.DB_USER, '-d', process.env.DB_NAME, archivo],
  { stdio: 'inherit', env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } });
process.exit(r.status ?? 1);
