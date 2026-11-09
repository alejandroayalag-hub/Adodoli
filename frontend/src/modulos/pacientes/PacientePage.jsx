import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { boton, botonSec, tarjeta, dinero } from '../../ui';
import { useModulo } from '../../App';
import { PacienteModal, nombreCompleto, edad, fecha } from './comunes';
import Antecedentes from './Antecedentes';
import CitaModal, { ESTADOS, COLOR } from '../agenda/CitaModal';
import MovimientoModal, { METODOS } from '../finanzas/MovimientoModal';
import * as pac from './api';
import * as agenda from '../agenda/api';
import * as fin from '../finanzas/api';
import Odontologia from '../odontologia/Odontologia';
import Consentimientos from '../consentimientos/Consentimientos';

function Citas({ paciente }) {
  const [citas, setCitas] = useState([]);
  const [cita, setCita] = useState(null);
  const cargar = () => agenda.getDePaciente(paciente.id).then(setCitas).catch(() => {});
  useEffect(() => { cargar(); }, [paciente.id]);
  return (
    <div>
      <div className="flex mb-3"><button className={`${boton} ml-auto`} onClick={() => setCita({ paciente: { id: paciente.id, nombre: nombreCompleto(paciente) } })}>+ Nueva cita</button></div>
      <div className="space-y-2">
        {citas.map(c => (
          <button key={c.id} onClick={() => setCita(c)} className={`block w-full text-left border rounded-lg p-3 text-sm ${COLOR[c.estado]}`}>
            <span className="font-medium">{fecha(c.inicio_local)} · {c.inicio_local.slice(11)}</span> — {ESTADOS[c.estado]}
            {c.motivo && <span className="block">{c.motivo}</span>}
          </button>
        ))}
        {!citas.length && <p className="text-center text-zinc-400 py-8 text-sm">Sin citas</p>}
      </div>
      {cita && <CitaModal cita={cita} onClose={(r) => { setCita(null); if (r) cargar(); }} />}
    </div>
  );
}

function Pagos({ paciente }) {
  const [movs, setMovs] = useState([]);
  const [mov, setMov] = useState(null);
  const cargar = () => fin.getDePaciente(paciente.id).then(setMovs).catch(() => {});
  useEffect(() => { cargar(); }, [paciente.id]);
  const pac_ = { id: paciente.id, nombre: nombreCompleto(paciente) };
  const total = movs.reduce((s, m) => s + Number(m.monto), 0);
  return (
    <div>
      <div className="flex items-center mb-3">
        <p className="text-sm text-zinc-600 flex-1">Total pagado: <b>{dinero(total)}</b></p>
        <button className={boton} onClick={() => setMov({ tipo: 'ingreso', categoria: 'Consulta', paciente: pac_ })}>+ Registrar pago</button>
      </div>
      <div className={`${tarjeta} divide-y divide-zinc-100`}>
        {movs.map(m => (
          <button key={m.id} className="flex w-full text-left text-sm p-3 hover:bg-zinc-50" onClick={() => setMov({ ...m, paciente: pac_ })}>
            <span className="w-28">{fecha(m.fecha)}</span>
            <span className="flex-1">{m.concepto} <span className="text-zinc-400">· {METODOS[m.metodo]}</span></span>
            <span className="font-medium">{dinero(m.monto)}</span>
          </button>
        ))}
        {!movs.length && <p className="text-center text-zinc-400 py-8 text-sm">Sin pagos</p>}
      </div>
      {mov && <MovimientoModal mov={mov} onClose={(r) => { setMov(null); if (r) cargar(); }} />}
    </div>
  );
}

export default function PacientePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const conAgenda = useModulo('agenda');
  const conFinanzas = useModulo('finanzas');
  const conOdonto = useModulo('odontologia');
  const conConsent = useModulo('consentimientos');
  const [p, setP] = useState(null);
  const [editando, setEditando] = useState(false);
  const [tab, setTab] = useState('historia');

  const cargar = () => pac.getPaciente(id).then(setP).catch(() => {});
  useEffect(() => { cargar(); }, [id]);
  if (!p) return null;

  async function baja() {
    if (!window.confirm(`¿Dar de baja a ${nombreCompleto(p)}? Su historial se conserva.`)) return;
    await pac.borrarPaciente(p.id); navigate('/pacientes');
  }

  const tabs = [['historia', 'Historia clínica'], conOdonto && ['odontologia', 'Odontología'], conConsent && ['consentimientos', 'Consentimientos'],
    conAgenda && ['citas', 'Citas'], conFinanzas && ['pagos', 'Pagos']].filter(Boolean);
  const e = edad(p.fecha_nacimiento);
  return (
    <div>
      <Link to="/pacientes" className="text-sm text-zinc-500 hover:underline print:hidden">← Pacientes</Link>
      <div className={`${tarjeta} p-4 mt-1 mb-4 flex flex-wrap gap-4 items-start print:border-0 print:p-0`}>
        <div className="flex-1 min-w-48">
          <h1 className="text-2xl font-bold">{nombreCompleto(p)}</h1>
          <p className="text-sm text-zinc-600">
            {[e != null && `${e} años`, p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : null,
              p.fecha_nacimiento && `Nac. ${fecha(p.fecha_nacimiento)}`].filter(Boolean).join(' · ')}
          </p>
          <p className="text-sm text-zinc-600">{[p.telefono, p.email].filter(Boolean).join(' · ')}</p>
          {p.direccion && <p className="text-sm text-zinc-500">{p.direccion}</p>}
          {p.notas && <p className="text-sm text-zinc-500 mt-1 whitespace-pre-line print:hidden">{p.notas}</p>}
        </div>
        <div className="flex gap-2 print:hidden">
          <button className={botonSec} onClick={() => setEditando(true)}>Editar</button>
          <button className={`${botonSec} text-red-600`} onClick={baja}>Dar de baja</button>
        </div>
      </div>
      {tabs.length > 1 && (
        <div className="flex gap-1 mb-4 border-b border-zinc-200 print:hidden">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
                    className={`px-3 py-2 text-sm -mb-px border-b-2 ${tab === k ? 'border-[var(--acento)] font-medium' : 'border-transparent text-zinc-500'}`}>{l}</button>
          ))}
        </div>
      )}
      {tab === 'historia' && <Antecedentes key={p.id} paciente={p} onGuardado={cargar} />}
      {tab === 'odontologia' && <Odontologia paciente={p} />}
      {tab === 'consentimientos' && <Consentimientos paciente={p} />}
      {tab === 'citas' && <Citas paciente={p} />}
      {tab === 'pagos' && <Pagos paciente={p} />}
      {editando && <PacienteModal paciente={p} onClose={(r) => { setEditando(false); if (r) cargar(); }} />}
    </div>
  );
}
