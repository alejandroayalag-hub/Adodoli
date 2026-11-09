// Pestaña Consentimientos de la ficha del paciente: firmar en pantalla (o imprimir para firmar en papel) y consultar los firmados.
import { useEffect, useState } from 'react';
import { input, boton, botonSec, tarjeta, Campo, Modal, errorDe, fechaHora, useImprimir } from '../../ui';
import { esAdmin } from '../../sesion';
import { nombreCompleto, edad } from '../pacientes/comunes';
import Firma from './Firma';
import { ConsentimientoImpreso } from './comunes';
import * as con from './api';

function NuevoModal({ paciente, plantillas, onClose }) {
  const menor = (edad(paciente.fecha_nacimiento) ?? 99) < 18;
  const [f, setF] = useState({ plantilla_id: '', motivo: '', firmante: menor ? '' : nombreCompleto(paciente), parentesco: '', firma: null });
  const [error, setError] = useState('');
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const pl = plantillas.find(p => p.id === Number(f.plantilla_id));
  const tutor = pl?.firma_tutor || menor;
  const listo = pl && f.firmante.trim() && (!tutor || f.parentesco.trim());

  async function guardar(conFirma) {
    if (conFirma && !f.firma) return setError('Falta la firma');
    try { onClose(await con.firmar(paciente.id, { ...f, firma: conFirma ? f.firma : null, parentesco: tutor ? f.parentesco : null })); }
    catch (err) { setError(errorDe(err)); }
  }
  return (
    <Modal titulo="Nuevo consentimiento" onClose={() => onClose(null)} ancho="max-w-2xl">
      <div className="space-y-3">
        <Campo label="Consentimiento">
          <select className={input} value={f.plantilla_id} onChange={e => set('plantilla_id', e.target.value)}>
            <option value="">Elegir…</option>
            {plantillas.filter(p => p.activa).map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
          </select>
        </Campo>
        {pl && <div className="text-sm whitespace-pre-line bg-zinc-50 border rounded-lg p-3 max-h-60 overflow-y-auto">{pl.texto}</div>}
        <Campo label="Motivo de la consulta"><input className={input} value={f.motivo} onChange={e => set('motivo', e.target.value)} /></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label={tutor ? 'Nombre del padre / tutor *' : 'Nombre de quien firma *'}>
            <input className={input} value={f.firmante} onChange={e => set('firmante', e.target.value)} />
          </Campo>
          {tutor && <Campo label="Parentesco *"><input className={input} value={f.parentesco} placeholder="Madre, padre, tutor…" onChange={e => set('parentesco', e.target.value)} /></Campo>}
        </div>
        <Firma onChange={v => set('firma', v)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button className={botonSec} disabled={!listo} onClick={() => guardar(false)}
                  title="Se guarda sin firma digital y se imprime para firmar en papel">Guardar e imprimir para firmar en papel</button>
          <button className={`${boton} ml-auto`} disabled={!listo} onClick={() => guardar(true)}>Guardar con firma</button>
        </div>
      </div>
    </Modal>
  );
}

export default function Consentimientos({ paciente }) {
  const [lista, setLista] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [nuevo, setNuevo] = useState(false);
  const [impresion, imprimir] = useImprimir();
  const cargar = () => con.getDePaciente(paciente.id).then(setLista).catch(() => {});
  useEffect(() => { cargar(); con.getPlantillas().then(setPlantillas).catch(() => {}); }, [paciente.id]);
  const ver = (c) => imprimir(<ConsentimientoImpreso c={c} paciente={paciente} />);

  async function anular(c) {
    if (!window.confirm(`¿Anular "${c.titulo}" firmado el ${fechaHora(c.created_at)}? Se borra definitivamente.`)) return;
    try { await con.anular(c.id); cargar(); } catch (e) { alert(errorDe(e)); }
  }
  return (
    <div>
      <div className="flex mb-3"><button className={`${boton} ml-auto`} onClick={() => setNuevo(true)}>+ Nuevo consentimiento</button></div>
      <div className={`${tarjeta} divide-y divide-zinc-100`}>
        {lista.map(c => (
          <div key={c.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
            <div className="flex-1 min-w-60">
              <p className="font-medium">{c.titulo}</p>
              <p className="text-zinc-500">{fechaHora(c.created_at)} · firmó {c.firmante}{c.parentesco && ` (${c.parentesco})`} ·{' '}
                {c.firma ? <span className="text-emerald-700">firma digital</span> : <span className="text-amber-700">firma en papel</span>}</p>
            </div>
            <button className={botonSec} onClick={() => ver(c)}>Imprimir</button>
            {esAdmin() && <button className="text-xs text-red-600 hover:underline" onClick={() => anular(c)}>Anular</button>}
          </div>
        ))}
        {!lista.length && <p className="text-center text-zinc-400 py-8 text-sm">Sin consentimientos</p>}
      </div>
      {nuevo && <NuevoModal paciente={paciente} plantillas={plantillas}
                            onClose={(c) => { setNuevo(false); if (c) { cargar(); if (!c.firma) ver(c); } }} />}
      {impresion}
    </div>
  );
}
