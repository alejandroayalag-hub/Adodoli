import { useState } from 'react';
import { input, boton, botonSec, Campo, Modal, errorDe } from '../../ui';
import { useModulo } from '../../App';
import { BuscarPaciente } from '../pacientes/comunes';
import MovimientoModal from '../finanzas/MovimientoModal';
import * as agenda from './api';

export const ESTADOS = { programada: 'Programada', confirmada: 'Confirmada', atendida: 'Atendida', cancelada: 'Cancelada', no_asistio: 'No asistió' };
export const COLOR = {
  programada: 'bg-sky-50 border-sky-300 text-sky-900', confirmada: 'bg-indigo-50 border-indigo-300 text-indigo-900',
  atendida: 'bg-emerald-50 border-emerald-300 text-emerald-900', cancelada: 'bg-zinc-50 border-zinc-200 text-zinc-400 line-through',
  no_asistio: 'bg-amber-50 border-amber-300 text-amber-900',
};
const DURACIONES = [15, 20, 30, 45, 60, 90, 120];

// cita: existente (de la API) o nueva { fecha, hora, paciente: {id, nombre} }
export default function CitaModal({ cita, onClose }) {
  const conFinanzas = useModulo('finanzas');
  const [paciente, setPaciente] = useState(cita.paciente_id ? { id: cita.paciente_id, nombre: cita.paciente } : cita.paciente || null);
  const [form, setForm] = useState({
    fecha: cita.inicio_local?.slice(0, 10) || cita.fecha || new Date().toLocaleDateString('en-CA'),
    hora: cita.inicio_local?.slice(11, 16) || cita.hora || '09:00',
    duracion_min: cita.duracion_min || 30, motivo: cita.motivo || '', estado: cita.estado || 'programada', notas: cita.notas || '',
  });
  const [error, setError] = useState('');
  const [cobrar, setCobrar] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function guardar(e) {
    e.preventDefault();
    if (!paciente) return setError('Elige un paciente');
    const data = { ...form, paciente_id: paciente.id, inicio: `${form.fecha}T${form.hora}` };
    try {
      const r = cita.id ? await agenda.editarCita(cita.id, data) : await agenda.crearCita(data);
      if (r.empalmes && !window.confirm(`Ojo: se empalma con ${r.empalmes} cita(s). ¿Dejarla así?`)) return;
      onClose(true);
    } catch (err) { setError(errorDe(err)); }
  }
  async function borrar() {
    if (!window.confirm('¿Eliminar la cita? (para conservarla, márcala como cancelada)')) return;
    try { await agenda.borrarCita(cita.id); onClose(true); } catch (err) { setError(errorDe(err)); }
  }

  if (cobrar) return (
    <MovimientoModal mov={{ tipo: 'ingreso', concepto: form.motivo || 'Consulta', categoria: 'Consulta', paciente, cita_id: cita.id }}
                     onClose={(r) => { setCobrar(false); if (r) onClose(true); }} />
  );
  return (
    <Modal titulo={cita.id ? 'Cita' : 'Nueva cita'} onClose={() => onClose(false)}>
      <form onSubmit={guardar} className="space-y-3">
        <Campo label="Paciente *"><BuscarPaciente value={paciente} onChange={setPaciente} required /></Campo>
        <div className="grid grid-cols-3 gap-3">
          <Campo label="Fecha"><input className={input} type="date" required value={form.fecha} onChange={e => set('fecha', e.target.value)} /></Campo>
          <Campo label="Hora"><input className={input} type="time" required step="300" value={form.hora} onChange={e => set('hora', e.target.value)} /></Campo>
          <Campo label="Duración">
            <select className={input} value={form.duracion_min} onChange={e => set('duracion_min', Number(e.target.value))}>
              {DURACIONES.map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </Campo>
        </div>
        <Campo label="Motivo"><input className={input} value={form.motivo} onChange={e => set('motivo', e.target.value)} /></Campo>
        <Campo label="Estado">
          <select className={input} value={form.estado} onChange={e => set('estado', e.target.value)}>
            {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Campo>
        <Campo label="Notas"><textarea className={input} rows={2} value={form.notas} onChange={e => set('notas', e.target.value)} /></Campo>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          {cita.id && <button type="button" className={`${botonSec} text-red-600`} onClick={borrar}>Eliminar</button>}
          {cita.id && conFinanzas && <button type="button" className={botonSec} onClick={() => setCobrar(true)}>Cobrar</button>}
          <button className={`${boton} flex-1`}>Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
