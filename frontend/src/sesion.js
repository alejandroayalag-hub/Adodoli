// Sesión en localStorage: token, nombre, rol y módulos a los que entra
const CLAVES = ['token', 'nombre', 'rol', 'modulos', 'debe_cambiar_password'];

export function guardarSesion(d) {
  localStorage.setItem('token', d.token);
  localStorage.setItem('nombre', d.nombre);
  localStorage.setItem('rol', d.rol);
  localStorage.setItem('modulos', JSON.stringify(d.modulos || []));
  if (d.debe_cambiar_password) localStorage.setItem('debe_cambiar_password', 'true');
  else localStorage.removeItem('debe_cambiar_password');
}
export const cerrarSesion = () => CLAVES.forEach(k => localStorage.removeItem(k));
export const esAdmin = () => localStorage.getItem('rol') === 'admin';
export function puedeEntrar(clave) {
  if (esAdmin()) return true;
  try { return JSON.parse(localStorage.getItem('modulos') || '[]').includes(clave); } catch { return false; }
}
