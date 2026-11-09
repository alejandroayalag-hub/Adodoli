import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { boton, botonSec, tarjeta } from '../../ui';
import CitaModal, { COLOR } from './CitaModal';
import * as agenda from './api';

const iso = (d) => d.toLocaleDateString('en-CA');
function lunesDe(d) {
  const x = new Date(d); x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
const masDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export default function AgendaPage() {
  const [lunes, setLunes] = useState(() => lunesDe(new Date()));
  const [citas, setCitas] = useState([]);
  const [cita, setCita] = useState(null);
  const dias = Array.from({ length: 7 }, (_, i) => masDias(lunes, i));
  const hoy = iso(new Date());

  const cargar = () => agenda.getCitas(iso(dias[0]), iso(dias[6])).then(setCitas).catch(() => {});
  useEffect(() => { cargar(); }, [lunes]);

  const rango = `${dias[0].toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – ${dias[6].toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="flex items-center gap-1 flex-1">
          <button className={botonSec} aria-label="Semana anterior" onClick={() => setLunes(masDias(lunes, -7))}><ChevronLeft className="w-4 h-4" /></button>
          <button className={botonSec} onClick={() => setLunes(lunesDe(new Date()))}>Hoy</button>
          <button className={botonSec} aria-label="Semana siguiente" onClick={() => setLunes(masDias(lunes, 7))}><ChevronRight className="w-4 h-4" /></button>
          <span className="text-sm text-zinc-600 ml-2">{rango}</span>
        </div>
        <button className={boton} onClick={() => setCita({ fecha: hoy })}>+ Nueva cita</button>
      </div>
      <div className="grid gap-2 md:grid-cols-7">
        {dias.map(d => {
          const f = iso(d);
          const delDia = citas.filter(c => c.inicio_local.startsWith(f));
          return (
            <div key={f} className={`${tarjeta} p-2 min-h-32 ${f === hoy ? 'ring-2 ring-[var(--acento)]' : ''}`}>
              <div className="flex items-center mb-2">
                <p className="text-xs font-semibold uppercase text-zinc-500 flex-1">
                  {d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })}
                </p>
                <button className="text-zinc-400 hover:text-[var(--acento)] text-lg leading-none" aria-label="Agregar cita"
                        onClick={() => setCita({ fecha: f })}>+</button>
              </div>
              <div className="space-y-1">
                {delDia.map(c => (
                  <button key={c.id} onClick={() => setCita(c)}
                          className={`block w-full text-left border rounded-lg px-2 py-1 text-xs ${COLOR[c.estado]}`}>
                    <span className="font-semibold">{c.inicio_local.slice(11)}</span> {c.paciente}
                    {c.motivo && <span className="block opacity-75 truncate">{c.motivo}</span>}
                  </button>
                ))}
                {!delDia.length && <p className="text-xs text-zinc-300 md:hidden">Sin citas</p>}
              </div>
            </div>
          );
        })}
      </div>
      {cita && <CitaModal cita={cita} onClose={(r) => { setCita(null); if (r) cargar(); }} />}
    </div>
  );
}
