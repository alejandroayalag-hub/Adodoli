// Historia clínica: solo antecedentes (base HC-01 de Gioval, sin motivo de consulta ni valoraciones).
import { useState } from 'react';
import { input, boton, botonSec, tarjeta, Campo, errorDe, fechaHora } from '../../ui';
import { guardarAntecedentes } from './api';

const AHF = [
  ['diabetes', 'Diabetes mellitus'], ['hipertension', 'Hipertensión arterial'], ['cardiopatias', 'Cardiopatías'],
  ['cancer', 'Cáncer'], ['tiroides', 'Enf. tiroideas / endócrinas'], ['hematologicas', 'Enf. hematológicas'],
  ['autoinmunes', 'Enf. autoinmunes'], ['renales', 'Enf. renales'], ['psiquiatricas', 'Enf. psiquiátricas'],
  ['alergias', 'Alergias graves'], ['otras', 'Otras'],
];
const APP = [
  ['diabetes', 'Diabetes mellitus'], ['hipertension', 'Hipertensión arterial'],
  ['dislipidemia', 'Dislipidemia (colesterol / triglicéridos)'], ['tiroides', 'Hipotiroidismo / Hipertiroidismo'],
  ['autoinmunes', 'Enfermedades autoinmunes'], ['dermatologicas', 'Enfermedades dermatológicas crónicas'],
  ['psiquiatricas', 'Enf. psiquiátricas o neurológicas'], ['cancer', 'Cáncer (activo o en remisión)'],
  ['cardiovasculares', 'Enfermedades cardiovasculares'], ['renales', 'Enfermedades renales'], ['epilepsia', 'Epilepsia'],
  ['quirurgicos', 'Quirúrgicos — cirugías previas'], ['hospitalizaciones', 'Hospitalizaciones previas'],
  ['transfusiones', 'Transfusiones sanguíneas'], ['traumatismos', 'Traumatismos relevantes'],
];
const GINECO = [['menarca', 'Menarca'], ['fum', 'FUM'], ['ritmo', 'Ritmo menstrual'],
  ['gestas', 'Gestas'], ['partos', 'Partos'], ['abortos', 'Abortos'], ['cesareas', 'Cesáreas']];

function Seccion({ titulo, children, ninguna, onNinguna, labelNinguna = 'Sin antecedentes' }) {
  return (
    <section className={`${tarjeta} p-4 break-inside-avoid`}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h3 className="font-semibold flex-1">{titulo}</h3>
        {onNinguna && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-[var(--acento)]" checked={!!ninguna} onChange={e => onNinguna(e.target.checked)} />
            {labelNinguna}
          </label>
        )}
      </div>
      {!ninguna && children}
    </section>
  );
}

export default function Antecedentes({ paciente, onGuardado }) {
  const [h, setH] = useState(paciente.antecedentes || {});
  const [estado, setEstado] = useState('');
  const set = (k, v) => { setH(x => ({ ...x, [k]: v })); setEstado('cambios'); };
  const setIn = (grupo, k, v) => set(grupo, { ...(h[grupo] || {}), [k]: v });
  const T = ({ k, ...p }) => <input className={input} value={h[k] || ''} onChange={e => set(k, e.target.value)} {...p} />;
  const TA = ({ k, rows = 2 }) => <textarea className={input} rows={rows} value={h[k] || ''} onChange={e => set(k, e.target.value)} />;

  async function guardar() {
    setEstado('guardando');
    try { await guardarAntecedentes(paciente.id, h); setEstado('ok'); onGuardado?.(); }
    catch (e) { setEstado(errorDe(e)); }
  }

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <p className="text-xs text-zinc-500 flex-1">
          {paciente.antecedentes_actualizados
            ? `Actualizado ${fechaHora(paciente.antecedentes_actualizados)}${paciente.antecedentes_por ? ` por ${paciente.antecedentes_por}` : ''}`
            : 'Sin capturar'}
        </p>
        <button className={botonSec} onClick={() => window.print()}>Imprimir</button>
        <button className={boton} disabled={estado === 'guardando'} onClick={guardar}>Guardar historia</button>
      </div>
      {estado === 'ok' && <p className="text-sm text-emerald-700 print:hidden">Guardado</p>}
      {estado === 'cambios' && <p className="text-sm text-amber-700 print:hidden">Hay cambios sin guardar</p>}
      {!['', 'ok', 'cambios', 'guardando'].includes(estado) && <p className="text-sm text-red-600">{estado}</p>}

      <Seccion titulo="1. Antecedentes heredofamiliares" ninguna={h.ahf_ninguno} onNinguna={v => set('ahf_ninguno', v)}>
        <p className="text-xs text-zinc-500 mb-2">Familiares de primer grado</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AHF.map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-[var(--acento)]" checked={!!h.ahf?.[k]} onChange={e => setIn('ahf', k, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-3"><Campo label="Especifique (parentesco, cuál)">{T({ k: 'ahf_texto' })}</Campo></div>
      </Seccion>

      <Seccion titulo="2. Antecedentes personales patológicos" ninguna={h.app_ninguno} onNinguna={v => set('app_ninguno', v)}>
        <div className="divide-y divide-zinc-100">
          {APP.map(([k, label]) => {
            const v = h.app?.[k] || {};
            return (
              <div key={k} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <label className="flex items-center gap-2 text-sm w-64 max-w-full">
                  <input type="checkbox" className="accent-[var(--acento)]" checked={!!v.tiene}
                         onChange={e => setIn('app', k, { ...v, tiene: e.target.checked })} />
                  {label}
                </label>
                {v.tiene && (
                  <input className={`${input} flex-1 min-w-48`} placeholder="Tiempo de evolución / tratamiento"
                         value={v.detalle || ''} onChange={e => setIn('app', k, { ...v, detalle: e.target.value })} />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3"><Campo label="Otros">{TA({ k: 'app_otros' })}</Campo></div>
      </Seccion>

      <Seccion titulo="3. Medicamentos actuales y alergias" ninguna={h.med_ninguno} onNinguna={v => set('med_ninguno', v)}
               labelNinguna="Sin medicamentos ni alergias">
        <div className="space-y-3">
          <Campo label="Medicamentos actuales (nombre, dosis, frecuencia)">{TA({ k: 'medicamentos', rows: 3 })}</Campo>
          <Campo label="Alergias conocidas y tipo de reacción">{TA({ k: 'alergias' })}</Campo>
        </div>
      </Seccion>

      <Seccion titulo="4. Antecedentes personales no patológicos" ninguna={h.apnp_ninguno} onNinguna={v => set('apnp_ninguno', v)}
               labelNinguna="Sin datos relevantes">
        <div className="grid sm:grid-cols-2 gap-3">
          <Campo label="Tabaco (cigarros/día, ex-fumador)">{T({ k: 'tabaco' })}</Campo>
          <Campo label="Alcohol (frecuencia / cantidad)">{T({ k: 'alcohol' })}</Campo>
          <Campo label="Otras sustancias">{T({ k: 'sustancias' })}</Campo>
          <Campo label="Actividad física">{T({ k: 'ejercicio' })}</Campo>
          <Campo label="Sueño (horas / calidad)">{T({ k: 'sueno' })}</Campo>
          <Campo label="Tipo de sangre">{T({ k: 'tipo_sangre' })}</Campo>
        </div>
        <div className="mt-3"><Campo label="Alimentación">{TA({ k: 'alimentacion' })}</Campo></div>
      </Seccion>

      {paciente.sexo !== 'M' && (
        <Seccion titulo="5. Antecedentes gineco-obstétricos" ninguna={h.gineco_ninguno} onNinguna={v => set('gineco_ninguno', v)}
                 labelNinguna="No aplica">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {GINECO.map(([k, label]) => <Campo key={k} label={label}>{T({ k })}</Campo>)}
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <Campo label="Complicaciones en embarazos">{T({ k: 'complicaciones_emb' })}</Campo>
            <Campo label="Método anticonceptivo actual">{T({ k: 'mac' })}</Campo>
          </div>
        </Seccion>
      )}

      <Seccion titulo="Observaciones">
        {TA({ k: 'observaciones', rows: 3 })}
      </Seccion>
    </div>
  );
}
