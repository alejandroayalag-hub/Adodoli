import { nombreCompleto, edad, fecha } from '../pacientes/comunes';

// Documento impreso: encabezado del consultorio, datos del paciente, texto congelado y firmas
export function ConsentimientoImpreso({ c, paciente }) {
  const e = c.encabezado || {};
  const años = edad(paciente.fecha_nacimiento);
  return (
    <div className="text-[13px] leading-relaxed max-w-[720px] mx-auto">
      <div className="text-right border-b-2 border-black pb-2 mb-4">
        <p className="text-lg font-bold">{e.doctor}</p>
        {e.especialidad && <p className="italic">{e.especialidad}</p>}
        <p className="text-xs">{[e.cedula_prof && `Céd. Prof. ${e.cedula_prof}`, e.cedula_esp && `Céd. Esp. ${e.cedula_esp}`].filter(Boolean).join('   ')}</p>
        {(e.consultorio || e.direccion || e.telefono) && <p className="text-xs">{[e.consultorio, e.direccion, e.telefono].filter(Boolean).join(' · ')}</p>}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-4">
        <p><b>Paciente:</b> {nombreCompleto(paciente)}</p>
        <p><b>Fecha:</b> {fecha(c.created_at)}</p>
        <p><b>Edad:</b> {años != null ? `${años} años` : '—'}</p>
        <p><b>Motivo de la consulta:</b> {c.motivo || '—'}</p>
        <p><b>Dirección:</b> {paciente.direccion || '—'}</p>
        <p><b>Tel:</b> {paciente.telefono || '—'}</p>
      </div>
      <h2 className="text-center font-bold text-base mb-3">{c.titulo}</h2>
      <div className="whitespace-pre-line text-justify">{c.texto}</div>
      <div className="grid grid-cols-2 gap-12 mt-12 text-center">
        <div>
          <div className="h-20 flex items-end justify-center">{c.firma && <img src={c.firma} alt="Firma" className="max-h-20" />}</div>
          <div className="border-t border-black pt-1">{c.firmante}{c.parentesco && ` (${c.parentesco})`}</div>
          <p className="text-xs">Firma y nombre {c.parentesco ? 'del padre / tutor' : 'del paciente'}</p>
        </div>
        <div>
          <div className="h-20" />
          <div className="border-t border-black pt-1">{e.doctor}</div>
          <p className="text-xs">Médico responsable</p>
        </div>
      </div>
    </div>
  );
}
