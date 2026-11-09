// Registro de módulos de interfaz: cada carpeta con index.jsx es un módulo.
// Solo se muestran los que la instancia tiene instalados (/api/config) y a los que el usuario entra.
const encontrados = import.meta.glob('./*/index.jsx', { eager: true });

export const MODULOS = Object.fromEntries(
  Object.entries(encontrados).map(([ruta, m]) => [ruta.split('/')[1], m.default]));
