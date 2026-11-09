import { useEffect, useState } from 'react';
import { input, boton, Campo, Modal, errorDe } from '../../ui';
import * as pac from './api';

export const nombreCompleto = (p) => [p.nombre, p.apellidos].filter(Boolean).join(' ');
export const fecha = (v) => v ? new Date(`${String(v).slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { dateStyle: 'medium' }) : '—';
export function edad(fn) {
  if (!fn) return null;
  const n = new Date(`${String(fn).slice(0, 10)}T12:00:00`), h = new Date();
  return h.getFullYear() - n.getFullYear() - (h < new Date(h.getFullYear(), n.getMonth(), n.getDate()) ? 1 : 0);
}

export function PacienteModal({ paciente, onClose }) {
  const [form, setForm] = useState({
    nombre: paciente.nombre || '', apellidos: paciente.apellidos || '', fecha_nacimiento: paciente.fecha_nacimiento?.slice(0, 10) || '',
    sexo: paciente.sexo || '', telefono: paciente.telefono || '', email: paciente.email || '',
    direccion: paciente.direccion || '', notas: paciente.notas || '',
  });
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  async function guardar(e) {
    e.preventDefault();
    try {
      onClose(paciente.id ? await pac.editarPaciente(paciente.id, form) : await pac.crearPaciente(form));
    } catch (err) { setError(errorDe(err)); }
  }
  return (
    <Modal titulo={paciente.id ? 'Editar paciente' : 'Nuevo paciente'} onClose={() => onClose(null)}>
      <form onSubmit={guardar} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Nombre(s) *"><input className={input} required autoFocus value={form.nombre} onChange={e => set('nombre', e.target.value)} /></Campo>
          <Campo label="Apellidos"><input className={input} value={form.apellidos} onChange={e => set('apellidos', e.target.value)} /></Campo>
          <Campo label="Fecha de nacimiento"><input className={input} type="date" value={form.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)} /></Campo>
          <Campo label="Sexo">
            <select className={input} value={form.sexo} onChange={e => set('sexo', e.target.value)}>
              <option value="">—</option><option value="F">Femenino</option><option value="M">Masculino</option>
            </select>
          </Campo>
          <Campo label="Teléfono"><input className={input} type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} /></Campo>
          <Campo label="Correo"><input className={input} type="email" value={form.email} onChange={e => set('email', e.target.value)} /></Campo>
        </div>
        <Campo label="Dirección"><input className={input} value={form.direccion} onChange={e => set('direccion', e.target.value)} /></Campo>
        <Campo label="Notas"><textarea className={input} rows={2} value={form.notas} onChange={e => set('notas', e.target.value)} /></Campo>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className={`${boton} w-full`}>Guardar</button>
      </form>
    </Modal>
  );
}

// Selector con búsqueda; lo usan agenda y finanzas. value = { id, nombre } | null
export function BuscarPaciente({ value, onChange, required }) {
  const [q, setQ] = useState('');
  const [lista, setLista] = useState([]);
  useEffect(() => {
    if (value || !q.trim()) return;
    const t = setTimeout(() => pac.getPacientes(q).then(setLista).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [q, value]);

  if (value) return (
    <div className={`${input} flex items-center`}>
      <span className="flex-1">{value.nombre}</span>
      <button type="button" className="text-xs text-zinc-500 hover:underline" onClick={() => { onChange(null); setQ(''); }}>cambiar</button>
    </div>
  );
  return (
    <div className="relative">
      <input className={input} placeholder="Buscar paciente…" value={q} required={required} onChange={e => setQ(e.target.value)} />
      {!!q.trim() && !!lista.length && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow max-h-56 overflow-y-auto">
          {lista.map(p => (
            <button type="button" key={p.id} className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-50"
                    onClick={() => onChange({ id: p.id, nombre: nombreCompleto(p) })}>
              {nombreCompleto(p)}{p.telefono && <span className="text-zinc-400"> · {p.telefono}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
