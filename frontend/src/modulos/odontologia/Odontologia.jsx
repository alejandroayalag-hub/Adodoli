// Pestaña Odontología: cuestionario médico-dental (formato "neo") + hojas de endodoncia por diente con abonos.
import { useEffect, useState } from 'react';
import { input, boton, botonSec, tarjeta, Campo, Modal, errorDe, fechaHora, dinero, useImprimir } from '../../ui';
import { useConfig } from '../../App';
import { nombreCompleto, fecha } from '../pacientes/comunes';
import { METODOS } from '../finanzas/MovimientoModal';
import * as odo from './api';

const hoy = () => new Date().toLocaleDateString('en-CA');
const CONDUCTOS = ['Único', 'Vestibular', 'Palatino', 'Distal', 'Mesiovestibular', 'Mesiolingual', 'Mesiobucal', 'Distovestibular', 'Distolingual'];
const MEDIDAS = [['mm', 'mm'], ['ref', 'Ref.'], ['laj', 'LAJ'], ['lm', 'LM']];
const ENFERMEDADES = [['presion_alta', 'Presión alta'], ['asma', 'Asma'], ['sida', 'SIDA'], ['nerviosos', 'Desórdenes nerviosos'],
  ['renal', 'Enfermedad renal'], ['fiebre_reumatica', 'Fiebre reumática'], ['hepatitis', 'Hepatitis'], ['diabetes', 'Diabetes'],
  ['cardiaca', 'Enfermedad cardiaca'], ['cancer', 'Cáncer']];
const total = (h) => (h.tratamientos || []).reduce((s, t) => s + Number(t.costo || 0), 0);
const abonado = (h) => (h.abonos || []).reduce((s, a) => s + Number(a.monto), 0);

function SiNo({ value, onChange }) {
  return (
    <span className="inline-flex gap-3 text-sm shrink-0">
      {[['si', 'Sí'], ['no', 'No']].map(([v, l]) => (
        <label key={v} className="flex items-center gap-1">
          <input type="radio" className="accent-[var(--acento)]" checked={value === v} onChange={() => onChange(v)} />{l}
        </label>
      ))}
    </span>
  );
}

// Fuera de Historia: si se define adentro, React remonta los inputs en cada tecla y se pierde el foco
function Pregunta({ n, texto, value, onChange, children }) {
  return (
    <div className="py-2 border-b border-zinc-100 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm flex-1 min-w-60">{n}.- {texto}</span>
        {onChange && <SiNo value={value} onChange={onChange} />}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

function Historia({ paciente, historia, onGuardado }) {
  const [h, setH] = useState(historia?.datos || {});
  const [estado, setEstado] = useState('');
  const set = (k, v) => { setH(x => ({ ...x, [k]: v })); setEstado('cambios'); };
  const T = (k, props) => <input className={input} value={h[k] || ''} onChange={e => set(k, e.target.value)} {...props} />;
  const sn = (k) => ({ value: h[k], onChange: v => set(k, v) });
  async function guardar() {
    setEstado('guardando');
    try { await odo.guardarHistoria(paciente.id, h); setEstado('ok'); onGuardado(); }
    catch (e) { setEstado(errorDe(e)); }
  }
  return (
    <section className={`${tarjeta} p-4 space-y-3`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold flex-1">Historia odontológica</h3>
        <span className="text-xs text-zinc-500">
          {historia ? `Actualizada ${fechaHora(historia.updated_at)}${historia.actualizado_por_nombre ? ` por ${historia.actualizado_por_nombre}` : ''}` : 'Sin capturar'}
        </span>
        <button className={boton} disabled={estado === 'guardando'} onClick={guardar}>Guardar</button>
      </div>
      {estado === 'ok' && <p className="text-sm text-emerald-700">Guardado</p>}
      {estado === 'cambios' && <p className="text-sm text-amber-700">Hay cambios sin guardar</p>}
      {!['', 'ok', 'cambios', 'guardando'].includes(estado) && <p className="text-sm text-red-600">{estado}</p>}

      <div className="grid sm:grid-cols-3 gap-3">
        <Campo label="Ocupación">{T('ocupacion')}</Campo>
        <Campo label="Celular">{T('celular', { type: 'tel' })}</Campo>
        <Campo label="Tel. oficina">{T('tel_oficina', { type: 'tel' })}</Campo>
        <Campo label="Dirección oficina">{T('direccion_oficina')}</Campo>
        <div className="sm:col-span-2"><Campo label="Doctor o persona que lo recomienda">{T('recomendado_por')}</Campo></div>
      </div>

      <div>
        <p className="text-xs font-medium text-zinc-500 mb-1">Historia médica</p>
        <Pregunta n="1" texto="¿Ha tenido cambios en su salud este año?" {...sn('cambios_salud')} />
        <Pregunta n="2" texto="¿Recibe tratamiento médico actualmente?" {...sn('tratamiento_medico')}>
          {h.tratamiento_medico === 'si' && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Campo label="3.- ¿Cuál es la causa?">{T('causa')}</Campo>
              <Campo label="3B.- Nombre del medicamento">{T('medicamento')}</Campo>
            </div>
          )}
        </Pregunta>
        <Pregunta n="4" texto="¿Es alérgico a anestesia, penicilina u otro medicamento o alimento?" {...sn('alergico')}>
          {h.alergico === 'si' && <Campo label="4B.- Señale cuál">{T('alergias')}</Campo>}
        </Pregunta>
        <Pregunta n="5" texto="¿Ha tenido sangrado excesivo en alguna intervención o necesitó transfusión?" {...sn('sangrado')} />
        <Pregunta n="6" texto="¿Ha padecido desmayos o convulsiones?" {...sn('desmayos')} />
        <Pregunta n="7" texto="¿Ha tenido alguna de las siguientes enfermedades?" {...sn('enfermedades')}>
          {h.enfermedades === 'si' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ENFERMEDADES.map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-[var(--acento)]" checked={!!h.enf?.[k]}
                         onChange={e => set('enf', { ...(h.enf || {}), [k]: e.target.checked })} />{l}
                </label>
              ))}
              <div className="col-span-2">{T('enf_otra', { placeholder: 'Otra' })}</div>
            </div>
          )}
        </Pregunta>
        {paciente.sexo !== 'M' && (
          <Pregunta n="8" texto="Pacientes mujeres: ¿está usted embarazada?" {...sn('embarazo')}>
            {h.embarazo === 'si' && <Campo label="8B.- ¿Cuántos meses tiene de embarazo?">{T('embarazo_meses')}</Campo>}
          </Pregunta>
        )}
        <Pregunta n="9" texto="¿Ha recibido tratamiento endodóntico antes?" {...sn('endodoncia_previa')} />
        <div className="pt-2"><Campo label="9B.- Motivo de la consulta">
          <textarea className={input} rows={2} value={h.motivo || ''} onChange={e => set('motivo', e.target.value)} />
        </Campo></div>
      </div>
    </section>
  );
}

function HojaImpresa({ hoja, paciente, consultorio }) {
  const celda = 'border border-zinc-400 px-2 py-1';
  return (
    <div className="text-sm space-y-3">
      <div className="flex justify-between border-b-2 border-black pb-2">
        <h1 className="text-lg font-bold">{consultorio}</h1>
        <span>Hoja de endodoncia</span>
      </div>
      <p><b>Nombre:</b> {nombreCompleto(paciente)}</p>
      <p><b>Diente:</b> {hoja.diente || '—'} · <b>Grapa:</b> {hoja.grapa || '—'} · <b>Diagnóstico:</b> {hoja.diagnostico || '—'} · <b>Fecha:</b> {fecha(hoja.fecha)}</p>
      {hoja.descripcion && <p className="whitespace-pre-line"><b>Descripción:</b> {hoja.descripcion}</p>}
      {hoja.observaciones && <p className="whitespace-pre-line"><b>Observaciones:</b> {hoja.observaciones}</p>}
      <table className="w-full border-collapse">
        <thead><tr>{['Conducto', ...MEDIDAS.map(m => m[1]), 'Técnica'].map(t => <th key={t} className={`${celda} text-left`}>{t}</th>)}</tr></thead>
        <tbody>
          {CONDUCTOS.filter(c => Object.values(hoja.conductos?.[c] || {}).some(Boolean)).map(c => (
            <tr key={c}><td className={celda}>{c}</td>{[...MEDIDAS.map(m => m[0]), 'tecnica'].map(k => <td key={k} className={celda}>{hoja.conductos[c][k]}</td>)}</tr>
          ))}
        </tbody>
      </table>
      <table className="w-full border-collapse">
        <thead><tr><th className={`${celda} text-left`}>Tratamiento</th><th className={`${celda} text-right w-32`}>Costo</th></tr></thead>
        <tbody>
          {(hoja.tratamientos || []).map((t, i) => <tr key={i}><td className={celda}>{t.concepto}</td><td className={`${celda} text-right`}>{dinero(t.costo)}</td></tr>)}
          <tr><td className={`${celda} text-right font-bold`}>Total</td><td className={`${celda} text-right font-bold`}>{dinero(total(hoja))}</td></tr>
        </tbody>
      </table>
      <table className="w-full border-collapse">
        <thead><tr>{['Fecha', 'A favor', 'Saldo'].map(t => <th key={t} className={`${celda} text-left`}>{t}</th>)}</tr></thead>
        <tbody>
          {(hoja.abonos || []).map((a, i) => (
            <tr key={a.id}><td className={celda}>{fecha(a.fecha)}</td><td className={celda}>{dinero(a.monto)}</td>
              <td className={celda}>{dinero(total(hoja) - hoja.abonos.slice(0, i + 1).reduce((s, x) => s + Number(x.monto), 0))}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HojaModal({ hoja, paciente, onClose, onImprimir }) {
  const [f, setF] = useState({
    fecha: hoja.fecha?.slice(0, 10) || hoy(), diente: hoja.diente || '', grapa: hoja.grapa || '', diagnostico: hoja.diagnostico || '',
    descripcion: hoja.descripcion || '', observaciones: hoja.observaciones || '', conductos: hoja.conductos || {},
    tratamientos: hoja.tratamientos?.length ? hoja.tratamientos : [{ concepto: '', costo: '' }],
  });
  const [abono, setAbono] = useState({ monto: '', metodo: 'efectivo', fecha: hoy() });
  const [error, setError] = useState('');
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const setConducto = (c, k, v) => set('conductos', { ...f.conductos, [c]: { ...(f.conductos[c] || {}), [k]: v } });
  const setTrat = (i, k, v) => set('tratamientos', f.tratamientos.map((t, j) => (j === i ? { ...t, [k]: v } : t)));
  const saldo = total(f) - abonado(hoja);

  async function guardar(e) {
    e?.preventDefault();
    try {
      if (hoja.id) await odo.editarHoja(hoja.id, f); else await odo.crearHoja({ ...f, paciente_id: paciente.id });
      onClose(true);
    } catch (err) { setError(errorDe(err)); }
  }
  async function registrarAbono() {
    try { await odo.editarHoja(hoja.id, f); await odo.abonar(hoja.id, abono); onClose(true); }
    catch (err) { setError(errorDe(err)); }
  }
  async function borrar() {
    if (!window.confirm('¿Borrar esta hoja de endodoncia?')) return;
    try { await odo.borrarHoja(hoja.id); onClose(true); } catch (err) { setError(errorDe(err)); }
  }
  const cel = 'border border-zinc-200 px-1 py-0.5';
  return (
    <Modal titulo={hoja.id ? `Endodoncia${hoja.diente ? ` · diente ${hoja.diente}` : ''}` : 'Nueva hoja de endodoncia'} onClose={() => onClose(false)} ancho="max-w-4xl">
      <form onSubmit={guardar} className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Campo label="Fecha"><input className={input} type="date" value={f.fecha} onChange={e => set('fecha', e.target.value)} /></Campo>
          <Campo label="Diente"><input className={input} value={f.diente} onChange={e => set('diente', e.target.value)} placeholder="p. ej. 36" /></Campo>
          <Campo label="Grapa"><input className={input} value={f.grapa} onChange={e => set('grapa', e.target.value)} /></Campo>
          <Campo label="Diagnóstico"><input className={input} value={f.diagnostico} onChange={e => set('diagnostico', e.target.value)} /></Campo>
        </div>
        <Campo label="Descripción"><textarea className={input} rows={3} value={f.descripcion} onChange={e => set('descripcion', e.target.value)} /></Campo>
        <Campo label="Observaciones"><textarea className={input} rows={2} value={f.observaciones} onChange={e => set('observaciones', e.target.value)} /></Campo>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-[var(--acento)] text-white">
              <tr><th className="px-2 py-1 text-left">Conducto</th>{MEDIDAS.map(([k, l]) => <th key={k} className="px-2 py-1 w-20">{l}</th>)}<th className="px-2 py-1">Técnica</th></tr>
            </thead>
            <tbody>
              {CONDUCTOS.map(c => (
                <tr key={c}>
                  <td className={`${cel} font-medium whitespace-nowrap`}>{c}</td>
                  {[...MEDIDAS.map(m => m[0]), 'tecnica'].map(k => (
                    <td key={k} className={cel}>
                      <input className="w-full px-1 py-0.5 text-sm focus:outline-none focus:bg-zinc-50" value={f.conductos[c]?.[k] || ''}
                             onChange={e => setConducto(c, k, e.target.value)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1">Tratamiento y costo</p>
          {f.tratamientos.map((t, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input className={input} placeholder="Tratamiento" value={t.concepto || ''} onChange={e => setTrat(i, 'concepto', e.target.value)} />
              <input className={`${input} w-32`} type="number" min="0" step="0.01" placeholder="Costo" value={t.costo} onChange={e => setTrat(i, 'costo', e.target.value)} />
              <button type="button" className="text-zinc-400 hover:text-red-600 px-1" aria-label="Quitar"
                      onClick={() => set('tratamientos', f.tratamientos.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <div className="flex items-center">
            <button type="button" className="text-sm text-[var(--acento)] hover:underline" onClick={() => set('tratamientos', [...f.tratamientos, { concepto: '', costo: '' }])}>+ Agregar tratamiento</button>
            <span className="ml-auto text-sm">Total: <b>{dinero(total(f))}</b></span>
          </div>
        </div>

        {hoja.id && (
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-zinc-500 mb-1">Abonos (se registran en Finanzas)</p>
            {(hoja.abonos || []).map(a => (
              <p key={a.id} className="text-sm flex"><span className="w-32">{fecha(a.fecha)}</span><span className="flex-1 text-zinc-500">{METODOS[a.metodo]}</span>{dinero(a.monto)}</p>
            ))}
            <p className="text-sm text-right mt-1">Saldo: <b className={saldo > 0 ? 'text-amber-700' : 'text-emerald-700'}>{dinero(saldo)}</b></p>
            <div className="flex flex-wrap gap-2 mt-2">
              <input className={`${input} w-36`} type="date" value={abono.fecha} onChange={e => setAbono({ ...abono, fecha: e.target.value })} />
              <input className={`${input} w-32`} type="number" min="0" step="0.01" placeholder="Monto" value={abono.monto} onChange={e => setAbono({ ...abono, monto: e.target.value })} />
              <select className={`${input} w-40`} value={abono.metodo} onChange={e => setAbono({ ...abono, metodo: e.target.value })}>
                {Object.entries(METODOS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <button type="button" className={botonSec} disabled={!(Number(abono.monto) > 0)} onClick={registrarAbono}>Registrar abono</button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          {hoja.id && <button type="button" className={`${botonSec} text-red-600`} onClick={borrar}>Borrar</button>}
          {hoja.id && <button type="button" className={botonSec} onClick={() => onImprimir({ ...hoja, ...f })}>Imprimir</button>}
          <button className={`${boton} ml-auto`}>Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Odontologia({ paciente }) {
  const { nombre } = useConfig();
  const [datos, setDatos] = useState(null);
  const [hoja, setHoja] = useState(null);
  const [impresion, imprimir] = useImprimir();
  const cargar = () => odo.getDePaciente(paciente.id).then(setDatos).catch(() => {});
  useEffect(() => { cargar(); }, [paciente.id]);
  if (!datos) return null;
  return (
    <div className="space-y-4">
      <Historia key={datos.historia?.updated_at || 'nueva'} paciente={paciente} historia={datos.historia} onGuardado={cargar} />
      <section className={`${tarjeta} p-4`}>
        <div className="flex items-center mb-3">
          <h3 className="font-semibold flex-1">Endodoncias</h3>
          <button className={boton} onClick={() => setHoja({})}>+ Nueva hoja</button>
        </div>
        <div className="divide-y divide-zinc-100">
          {datos.endodoncias.map(h => (
            <button key={h.id} onClick={() => setHoja(h)} className="flex w-full text-left text-sm py-2 hover:bg-zinc-50 gap-3">
              <span className="w-28">{fecha(h.fecha)}</span>
              <span className="flex-1">{h.diente ? `Diente ${h.diente}` : 'Sin diente'}{h.diagnostico && <span className="text-zinc-500"> · {h.diagnostico}</span>}</span>
              <span>{dinero(total(h))}</span>
              <span className={`w-32 text-right ${total(h) - abonado(h) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>saldo {dinero(total(h) - abonado(h))}</span>
            </button>
          ))}
          {!datos.endodoncias.length && <p className="text-center text-zinc-400 py-6 text-sm">Sin hojas de endodoncia</p>}
        </div>
      </section>
      {hoja && <HojaModal hoja={hoja} paciente={paciente} onClose={(r) => { setHoja(null); if (r) cargar(); }}
                          onImprimir={(h) => imprimir(<HojaImpresa hoja={h} paciente={paciente} consultorio={nombre} />)} />}
      {impresion}
    </div>
  );
}
