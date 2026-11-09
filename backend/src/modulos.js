// Módulos instalados en esta instancia: MODULOS=pos,personal → carpetas de backend/modulos.
// Cada módulo exporta { nombre, router } y puede traer sus migraciones en <modulo>/migrations.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'modulos');
const disponibles = fs.readdirSync(DIR).filter(d => fs.existsSync(path.join(DIR, d, 'index.js')));
const claves = (process.env.MODULOS || '').split(',').map(s => s.trim()).filter(Boolean);

const desconocidos = claves.filter(c => !disponibles.includes(c));
if (desconocidos.length) {
  throw new Error(`MODULOS no existe(n): ${desconocidos.join(', ')}. Disponibles: ${disponibles.join(', ')}`);
}

module.exports = claves.map(clave => ({
  clave,
  migraciones: path.join(DIR, clave, 'migrations'),
  ...require(path.join(DIR, clave)),
}));
