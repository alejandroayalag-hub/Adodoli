# Dr. Alejandro Dodoli — Expediente dental

Fork de **Mi Consul** para el Dr. Alejandro Dodoli (cirujano dentista / endodoncia). Corre **en su laptop, sin nube**:
el backend sirve también la página (`FRONTEND_DIST`) y la base de datos es PostgreSQL local.

`MODULOS=pacientes,agenda,finanzas,odontologia,consentimientos,respaldos` (orden importa).

| Clave | Módulo |
|---|---|
| `odontologia` | Pestaña **Odontología** en la ficha: cuestionario médico-dental (formato "neo": preguntas 1–9B) + **hojas de endodoncia** por diente (grapa, diagnóstico, conductos mm/Ref/LAJ/LM/técnica, tratamientos con costo, abonos y saldo). Los abonos son ingresos de Finanzas ligados a la hoja (`finanzas_movimientos.endodoncia_id`). Requiere `pacientes` y `finanzas`. |
| `consentimientos` | Plantillas editables (admin) con llaves `{paciente} {edad} {fecha} {motivo} {tutor} {doctor} …`; precargadas: odontopediatría/manejo de conducta y endodoncia. En la ficha se firma **en pantalla** (dedo/pluma/mouse) o se imprime para firmar en papel. El texto se congela al firmar. Encabezado (médico, cédulas, clínica) en menú Consentimientos. |
| `respaldos` | `pg_dump` automático cada 24 h (revisa cada hora; la laptop no siempre está prendida) a `backend/respaldos` + copias en `RESPALDOS_COPIAS` (USB / disco externo, separadas por `;`). Conserva los últimos 30. Página Respaldos (solo admin): estado, "Respaldar ahora", descargar. |

## Restaurar un respaldo

Detener la app y luego: `cd backend && node src/scripts/restaurar.js <ruta/respaldo_AAAA-MM-DD_HHMM.dump>`
(borra lo actual y deja lo del respaldo; `pg_restore` debe ser de la misma versión que el servidor).

## Local

```
cp backend/.env.example backend/.env   # solo si no existe; JWT_SECRET con openssl rand -hex 32
docker compose -p dodoli --env-file backend/.env up -d       # Postgres en 127.0.0.1:5454 (solo desarrollo)
cd backend && npm install && npm start                        # :3025, aplica migraciones
node src/scripts/seed_admin.js admin@cliente.com "Dr. Nombre" # imprime contraseña temporal
cd frontend && npm install && API_PORT=3025 npm run dev
```

## Crear un módulo

- Backend: `backend/modulos/<clave>/index.js` exporta `{ nombre, router }`; tablas `<clave>_*` en `migrations/NNN_*.sql`. Se monta en `/api/<clave>` con sesión y permiso.
- Frontend: `frontend/src/modulos/<clave>/index.jsx` exporta `{ descripcion, Icono, menu, Rutas }`; se registra solo.
