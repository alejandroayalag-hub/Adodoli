// Datos del consultorio (encabezado) y plantillas de consentimiento. Editar: solo admin.
import { useEffect, useState } from 'react';
import { input, boton, botonSec, tarjeta, Campo, Modal, errorDe } from '../../ui';
import { esAdmin } from '../../sesion';
import * as con from './api';

const CAMPOS = [['doctor', 'Médico'], ['especialidad', 'Especialidad'], ['cedula_prof', 'Cédula profesional'], ['cedula_esp', 'Cédula de especialidad'],
  ['consultorio', 'Nombre de la clínica'], ['direccion', 'Dirección'], ['telefono', 'Teléfono']];
const LLAVES = '{paciente} {edad} {fecha} {motivo} {tutor} {doctor} {especialidad} {consultorio} {direccion} {telefono}';

function PlantillaModal({ plantilla, onClose }) {
  const [f, setF] = useState({ titulo: plantilla.titulo || '', texto: plantilla.texto || '', firma_tutor: !!plantilla.firma_tutor, activa: plantilla.activa !== false });
  const [error, setError] = useState('');
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  async function guardar(e) {
    e.preventDefault();
    try { await (plantilla.id ? con.editarPlantilla(plantilla.id, f) : con.crearPlantilla(f)); onClose(true); }
    catch (err) { setError(errorDe(err)); }
  }
  return (
    <Modal titulo={plantilla.id ? 'Editar consentimiento' : 'Nuevo consentimiento'} onClose={() => onClose(false)} ancho="max-w-3xl">
      <form onSubmit={guardar} className="space-y-3">
        <Campo label="Título *"><input className={input} required value={f.titulo} onChange={e => set('titulo', e.target.value)} /></Campo>
        <Campo label="Texto *"><textarea className={`${input} font-serif`} rows={16} required value={f.texto} onChange={e => set('texto', e.target.value)} /></Campo>
        <p className="text-xs text-zinc-500">Se reemplazan al firmar: <code>{LLAVES}</code>. Cambiar el texto no altera los ya firmados.</p>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-[var(--acento)]" checked={f.firma_tutor} onChange={e => set('firma_tutor', e.target.checked)} />Lo firma padre/tutor</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-[var(--acento)]" checked={f.activa} onChange={e => set('activa', e.target.checked)} />Activo</label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className={`${boton} w-full`}>Guardar</button>
      </form>
    </Modal>
  );
}

export default function PlantillasPage() {
  const admin = esAdmin();
  const [consultorio, setConsultorio] = useState({});
  const [plantillas, setPlantillas] = useState([]);
  const [editando, setEditando] = useState(null);
  const [estado, setEstado] = useState('');
  const cargar = () => con.getPlantillas().then(setPlantillas).catch(() => {});
  useEffect(() => { cargar(); con.getConsultorio().then(setConsultorio).catch(() => {}); }, []);

  async function guardarConsultorio(e) {
    e.preventDefault();
    try { setConsultorio(await con.guardarConsultorio(consultorio)); setEstado('Guardado'); }
    catch (err) { setEstado(errorDe(err)); }
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Consentimientos informados</h1>
      <form onSubmit={guardarConsultorio} className={`${tarjeta} p-4`}>
        <h2 className="font-semibold mb-3">Encabezado de los documentos</h2>
        <fieldset disabled={!admin} className="grid sm:grid-cols-2 gap-3">
          {CAMPOS.map(([k, l]) => (
            <Campo key={k} label={l}><input className={input} value={consultorio[k] || ''} onChange={e => { setConsultorio({ ...consultorio, [k]: e.target.value }); setEstado(''); }} /></Campo>
          ))}
        </fieldset>
        {admin && <div className="flex items-center gap-3 mt-3"><button className={boton}>Guardar encabezado</button><span className="text-sm text-zinc-500">{estado}</span></div>}
      </form>
      <section>
        <div className="flex items-center mb-2">
          <h2 className="font-semibold flex-1">Plantillas</h2>
          {admin && <button className={boton} onClick={() => setEditando({})}>+ Nueva plantilla</button>}
        </div>
        <div className={`${tarjeta} divide-y divide-zinc-100`}>
          {plantillas.map(p => (
            <div key={p.id} className="flex items-center gap-2 p-3 text-sm">
              <span className={`flex-1 ${p.activa ? '' : 'text-zinc-400 line-through'}`}>{p.titulo}{p.firma_tutor && <span className="text-zinc-400"> · firma tutor</span>}</span>
              {admin && <button className={botonSec} onClick={() => setEditando(p)}>Editar</button>}
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-2">Los consentimientos se firman desde la ficha de cada paciente, pestaña Consentimientos.</p>
      </section>
      {editando && <PlantillaModal plantilla={editando} onClose={(r) => { setEditando(null); if (r) cargar(); }} />}
    </div>
  );
}
