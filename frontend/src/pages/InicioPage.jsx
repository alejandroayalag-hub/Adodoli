import { Link } from 'react-router-dom';
import { useConfig, misModulos } from '../App';
import { tarjeta } from '../ui';

export default function InicioPage() {
  const config = useConfig();
  const modulos = misModulos(config);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Hola, {localStorage.getItem('nombre')}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulos.filter(m => m.menu?.length).map(m => (
          <Link key={m.clave} to={m.menu[0].to} className={`${tarjeta} p-6 hover:shadow-md transition-shadow`}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[var(--acento)]/10">
              <m.Icono className="w-5 h-5" style={{ color: 'var(--acento)' }} />
            </div>
            <h2 className="font-semibold">{m.nombre}</h2>
            <p className="text-sm text-zinc-500">{m.descripcion}</p>
          </Link>
        ))}
        {!modulos.length && <p className="text-zinc-500">No tienes módulos asignados. Pídele acceso al administrador.</p>}
      </div>
    </div>
  );
}
