// Piezas de interfaz compartidas por el núcleo y los módulos
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export const input = 'w-full min-w-0 border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--acento)]/40 focus:border-[var(--acento)]';
export const boton = 'rounded-lg px-4 py-2 text-sm font-medium text-white bg-[var(--acento)] hover:brightness-110 disabled:opacity-50 whitespace-nowrap';
export const botonSec = 'rounded-lg px-3 py-2 text-sm border border-zinc-300 bg-white hover:bg-zinc-50 whitespace-nowrap';
export const tarjeta = 'bg-white border border-zinc-200 rounded-xl';

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
export const dinero = (v) => mxn.format(Number(v || 0));
// 3 decimales solo si hacen falta (granel)
export const cantidad = (v) => Number(v).toLocaleString('es-MX', { maximumFractionDigits: 3 });
export const errorDe = (e, porDefecto = 'Ocurrió un error') => e.response?.data?.error || porDefecto;
export const fechaHora = (v) => new Date(v).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

export function Campo({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

export function Modal({ titulo, onClose, children, ancho = 'max-w-md' }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 print:hidden" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={`bg-white rounded-2xl p-6 w-full ${ancho} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center mb-4">
          <h2 className="text-lg font-semibold flex-1">{titulo}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Impresión de un documento suelto (hoja, consentimiento): se monta solo mientras se imprime,
// porque cualquier .print-area en la página oculta todo lo demás al imprimir.
export function useImprimir() {
  const [contenido, setContenido] = useState(null);
  useEffect(() => {
    if (!contenido) return;
    const fin = () => setContenido(null);
    window.addEventListener('afterprint', fin, { once: true });
    window.print();
    return () => window.removeEventListener('afterprint', fin);
  }, [contenido]);
  return [contenido && <div className="print-area w-full p-8 text-black">{contenido}</div>, setContenido];
}
