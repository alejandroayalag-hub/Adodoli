const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const { requireModulo } = require('./middleware/roles');
const runMigrations = require('./db/migrate');
const modulos = require('./modulos');

const app = express();
const PORT = process.env.PORT || 3023;

// Detrás de Nginx (1 hop): usar X-Forwarded-For para IP real en rate limiting.
app.set('trust proxy', 1);

// upgrade-insecure-requests rompe la página cuando el backend la sirve por http (caja sin internet)
app.use(helmet({ contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } } }));
app.use(cors({
  origin: ['http://localhost:5173', ...(process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(require('./middleware/normalizeQuery'));

// Rutas públicas
app.use('/api/auth', require('./routes/auth'));
app.get('/api/health', (req, res) => res.json({ ok: true }));
// Marca del cliente y módulos instalados: la pantalla de login ya los necesita
app.get('/api/config', (req, res) => res.json({
  nombre: process.env.CLIENTE_NOMBRE || 'HAVOC',
  color: process.env.CLIENTE_COLOR || '#7C3AED',
  modulos: modulos.map(m => ({ clave: m.clave, nombre: m.nombre })),
}));

// Núcleo
app.use('/api/usuarios', authMiddleware, require('./routes/usuarios'));

// Módulos instalados: cada uno en /api/<clave>, solo para quien tenga acceso.
// Un módulo puede exponer rutas sin sesión (p. ej. dispositivos) en /api/<clave>/publico
for (const m of modulos) {
  if (m.publico) app.use(`/api/${m.clave}/publico`, m.publico);
  app.use(`/api/${m.clave}`, authMiddleware, requireModulo(m.clave), m.router);
}

// Instalación sin internet (una caja, sin nginx): el backend sirve también el frontend.
if (process.env.FRONTEND_DIST) {
  app.use(express.static(process.env.FRONTEND_DIST));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(process.env.FRONTEND_DIST, 'index.html')));
}

app.use(errorHandler);

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Plataforma HAVOC (${process.env.CLIENTE_NOMBRE}) en puerto ${PORT} · módulos: ${modulos.map(m => m.clave).join(', ') || 'ninguno'}`);
    });
  })
  .catch(err => {
    console.error('Error en migraciones:', err);
    process.exit(1);
  });
