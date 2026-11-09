import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { input, boton, tarjeta } from '../../ui';
import { PacienteModal, nombreCompleto, edad } from './comunes';
import * as pac from './api';

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState([]);
  const [q, setQ] = useState('');
  const [nuevo, setNuevo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => pac.getPacientes(q).then(setPacientes).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold flex-1">Pacientes</h1>
        <button className={boton} onClick={() => setNuevo(true)}>+ Nuevo paciente</button>
      </div>
      <input className={`${input} mb-3`} placeholder="Buscar por nombre o teléfono" value={q} onChange={e => setQ(e.target.value)} />
      <div className={`${tarjeta} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>{['Paciente', 'Edad', 'Teléfono', 'Correo'].map(h => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {pacientes.map(p => (
              <tr key={p.id} className="border-t border-zinc-100">
                <td className="px-3 py-2"><Link className="font-medium hover:underline" to={`/pacientes/${p.id}`}>{nombreCompleto(p)}</Link></td>
                <td className="px-3 py-2">{edad(p.fecha_nacimiento) ?? '—'}</td>
                <td className="px-3 py-2">{p.telefono || '—'}</td>
                <td className="px-3 py-2">{p.email || '—'}</td>
              </tr>
            ))}
            {!pacientes.length && <tr><td colSpan={4} className="px-3 py-8 text-center text-zinc-400">Sin pacientes</td></tr>}
          </tbody>
        </table>
      </div>
      {nuevo && <PacienteModal paciente={{}} onClose={(p) => { setNuevo(false); if (p) navigate(`/pacientes/${p.id}`); }} />}
    </div>
  );
}
