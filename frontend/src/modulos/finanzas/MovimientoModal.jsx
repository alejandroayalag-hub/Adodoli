import { useEffect, useState } from 'react';
import { input, boton, botonSec, Campo, Modal, errorDe } from '../../ui';
import { useModulo } from '../../App';
import { BuscarPaciente } from '../pacientes/comunes';
import * as fin from './api';

export const METODOS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', otro: 'Otro' };
const hoy = () => new Date().toLocaleDateString('en-CA');

// mov: movimiento existente o valores iniciales ({ tipo, concepto, paciente: {id, nombre}, cita_id, monto })
export default function MovimientoModal({ mov, onClose }) {
  const conPacientes = useModulo('pacientes');
  const [form, setForm] = useState({
    tipo: mov.tipo || 'ingreso', fecha: mov.fecha?.slice(0, 10) || hoy(), concepto: mov.concepto || '',
    categoria: mov.categoria || (mov.tipo === 'egreso' ? '' : 'Consulta'), monto: mov.monto ?? '',
    metodo: mov.metodo || 'efectivo', notas: mov.notas || '', cita_id: mov.cita_id || null,
  });
  const [paciente, setPaciente] = useState(mov.paciente || (mov.paciente_id ? { id: mov.paciente_id, nombre: mov.paciente_nombre || `Paciente #${mov.paciente_id}` } : null));
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { fin.getCategorias().then(setCategorias).catch(() => {}); }, []);

  async function guardar(e) {
    e.preventDefault();
    const data = { ...form, paciente_id: form.tipo === 'ingreso' ? paciente?.id || null : null };
    try {
      if (mov.id) await fin.editarMovimiento(mov.id, data); else await fin.crearMovimiento(data);
      onClose(true);
    } catch (err) { setError(errorDe(err)); }
  }
  async function borrar() {
    if (!window.confirm('¿Eliminar este movimiento?')) return;
    try { await fin.borrarMovimiento(mov.id); onClose(true); } catch (err) { setError(errorDe(err)); }
  }

  return (
    <Modal titulo={mov.id ? 'Editar movimiento' : form.tipo === 'ingreso' ? 'Registrar cobro / ingreso' : 'Registrar gasto'} onClose={() => onClose(false)}>
      <form onSubmit={guardar} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {['ingreso', 'egreso'].map(t => (
            <button type="button" key={t} onClick={() => set('tipo', t)}
                    className={`rounded-lg py-2 text-sm border ${form.tipo === t ? 'bg-[var(--acento)] text-white border-transparent' : 'border-zinc-300'}`}>
              {t === 'ingreso' ? 'Ingreso' : 'Gasto'}
            </button>
          ))}
        </div>
        {form.tipo === 'ingreso' && conPacientes && (
          <Campo label="Paciente (opcional)"><BuscarPaciente value={paciente} onChange={setPaciente} /></Campo>
        )}
        <Campo label="Concepto *"><input className={input} required autoFocus value={form.concepto} onChange={e => set('concepto', e.target.value)} /></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Monto *"><input className={input} type="number" min="0.01" step="0.01" required value={form.monto} onChange={e => set('monto', e.target.value)} /></Campo>
          <Campo label="Fecha"><input className={input} type="date" required value={form.fecha} onChange={e => set('fecha', e.target.value)} /></Campo>
          <Campo label="Categoría">
            <input className={input} list="fin-categorias" placeholder="General" value={form.categoria} onChange={e => set('categoria', e.target.value)} />
            <datalist id="fin-categorias">
              {categorias.filter(c => c.tipo === form.tipo).map(c => <option key={c.categoria} value={c.categoria} />)}
            </datalist>
          </Campo>
          <Campo label="Método">
            <select className={input} value={form.metodo} onChange={e => set('metodo', e.target.value)}>
              {Object.entries(METODOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Campo>
        </div>
        <Campo label="Notas"><textarea className={input} rows={2} value={form.notas} onChange={e => set('notas', e.target.value)} /></Campo>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          {mov.id && <button type="button" className={`${botonSec} text-red-600`} onClick={borrar}>Eliminar</button>}
          <button className={`${boton} flex-1`}>Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
