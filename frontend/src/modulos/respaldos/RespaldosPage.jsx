// Respaldos de la base de datos: automático cada 24 h + manual, en esta computadora y en USB/disco externo.
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { boton, tarjeta, errorDe, fechaHora } from '../../ui';

const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;

export default function RespaldosPage() {
  const [d, setD] = useState(null);
  const [estado, setEstado] = useState('');
  const cargar = () => api.get('/respaldos').then(r => setD(r.data)).catch(e => setEstado(errorDe(e)));
  useEffect(() => { cargar(); }, []);

  async function respaldar() {
    setEstado('Respaldando…');
    try {
      const { data } = await api.post('/respaldos');
      const fallas = data.copias.filter(c => !c.ok);
      setEstado(fallas.length ? `Listo, pero no se copió a: ${fallas.map(c => `${c.dir} (${c.error})`).join(', ')}` : 'Respaldo listo');
    } catch (e) { setEstado(errorDe(e)); }
    cargar();
  }
  async function descargar(archivo) {
    const { data } = await api.get(`/respaldos/archivo/${archivo}`, { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(data); a.download = archivo; a.click();
    URL.revokeObjectURL(a.href);
  }
  if (!d) return <p className="text-sm text-red-600">{estado}</p>;
  const ultimo = d.archivos[0];
  const viejo = !ultimo || Date.now() - new Date(ultimo.fecha) > 2 * 864e5;
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">Respaldos</h1>
      <div className={`${tarjeta} p-4 space-y-2 ${viejo || d.ultimoError ? 'border-amber-400' : ''}`}>
        <p className="text-sm">Último respaldo: <b>{ultimo ? fechaHora(ultimo.fecha) : 'ninguno'}</b></p>
        {d.ultimoError && <p className="text-sm text-red-600">Último intento falló: {d.ultimoError}</p>}
        <p className="text-xs text-zinc-500">Se hace solo cada 24 h mientras la computadora esté prendida. Se guardan los últimos {d.conservar} en <code>{d.carpeta}</code>.</p>
        {d.copias.map(c => (
          <p key={c.dir} className={`text-sm ${c.conectada ? 'text-emerald-700' : 'text-amber-700'}`}>
            Copia en <code>{c.dir}</code>: {c.conectada ? `conectada · último ${c.ultimo || '—'}` : 'no conectada — conecta la USB / disco y presiona Respaldar ahora'}
          </p>
        ))}
        {!d.copias.length && <p className="text-sm text-amber-700">Sin copia externa configurada: si la laptop se pierde o se daña, se pierden también los respaldos.</p>}
        <div className="flex items-center gap-3 pt-1">
          <button className={boton} disabled={estado === 'Respaldando…'} onClick={respaldar}>Respaldar ahora</button>
          <span className="text-sm text-zinc-600">{estado}</span>
        </div>
      </div>
      <div className={`${tarjeta} divide-y divide-zinc-100`}>
        {d.archivos.map(a => (
          <div key={a.archivo} className="flex items-center text-sm p-3 gap-3">
            <span className="flex-1">{fechaHora(a.fecha)}</span>
            <span className="text-zinc-500">{mb(a.bytes)}</span>
            <button className="text-[var(--acento)] hover:underline" onClick={() => descargar(a.archivo).catch(() => setEstado('No se pudo descargar'))}>Descargar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
