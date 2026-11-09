import { useEffect, useState } from 'react';
import { input, boton, botonSec, tarjeta, dinero } from '../../ui';
import MovimientoModal, { METODOS } from './MovimientoModal';
import * as fin from './api';

const mesActual = () => new Date().toLocaleDateString('en-CA').slice(0, 7);
const fecha = (v) => new Date(`${v.slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

function Kpi({ label, valor, color }) {
  return (
    <div className={`${tarjeta} p-4`}>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{dinero(valor)}</p>
    </div>
  );
}

export default function FinanzasPage() {
  const [mes, setMes] = useState(mesActual());
  const [datos, setDatos] = useState(null);
  const [mov, setMov] = useState(null);
  const cargar = () => fin.getMes(mes).then(setDatos).catch(() => {});
  useEffect(() => { cargar(); }, [mes]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold flex-1">Finanzas</h1>
        <input type="month" className={`${input.replace("w-full ", "")} w-44`} value={mes} onChange={e => e.target.value && setMes(e.target.value)} />
        <button className={botonSec} onClick={() => setMov({ tipo: 'egreso' })}>+ Gasto</button>
        <button className={boton} onClick={() => setMov({ tipo: 'ingreso' })}>+ Ingreso</button>
      </div>
      {datos && <>
        <div className="grid gap-3 sm:grid-cols-3 mb-4">
          <Kpi label="Ingresos" valor={datos.ingresos} color="text-emerald-700" />
          <Kpi label="Gastos" valor={datos.egresos} color="text-red-600" />
          <Kpi label="Balance" valor={datos.balance} color={datos.balance < 0 ? 'text-red-600' : ''} />
        </div>
        {!!datos.categorias.length && (
          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            {['ingreso', 'egreso'].map(t => (
              <div key={t} className={`${tarjeta} p-4`}>
                <h2 className="text-sm font-semibold mb-2">{t === 'ingreso' ? 'Ingresos' : 'Gastos'} por categoría</h2>
                {datos.categorias.filter(c => c.tipo === t).map(c => (
                  <div key={c.categoria} className="flex text-sm py-0.5"><span className="flex-1">{c.categoria}</span><span>{dinero(c.total)}</span></div>
                ))}
                {!datos.categorias.some(c => c.tipo === t) && <p className="text-sm text-zinc-400">—</p>}
              </div>
            ))}
          </div>
        )}
        <div className={`${tarjeta} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>{['Fecha', 'Concepto', 'Categoría', 'Método', 'Monto'].map(h => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {datos.movimientos.map(m => (
                <tr key={m.id} className="border-t border-zinc-100 hover:bg-zinc-50 cursor-pointer" onClick={() => setMov(m)}>
                  <td className="px-3 py-2 whitespace-nowrap">{fecha(m.fecha)}</td>
                  <td className="px-3 py-2">{m.concepto}{m.paciente_nombre && <span className="text-zinc-400"> · {m.paciente_nombre}</span>}</td>
                  <td className="px-3 py-2">{m.categoria}</td>
                  <td className="px-3 py-2">{METODOS[m.metodo]}</td>
                  <td className={`px-3 py-2 text-right whitespace-nowrap font-medium ${m.tipo === 'ingreso' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {m.tipo === 'egreso' ? '−' : '+'}{dinero(m.monto)}
                  </td>
                </tr>
              ))}
              {!datos.movimientos.length && <tr><td colSpan={5} className="px-3 py-8 text-center text-zinc-400">Sin movimientos este mes</td></tr>}
            </tbody>
          </table>
        </div>
      </>}
      {mov && <MovimientoModal mov={mov} onClose={(r) => { setMov(null); if (r) cargar(); }} />}
    </div>
  );
}
