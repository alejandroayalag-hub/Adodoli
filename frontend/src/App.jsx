import { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from './api/client';
import { MODULOS } from './modulos';
import { cerrarSesion, esAdmin, puedeEntrar } from './sesion';
import LoginPage from './pages/LoginPage';
import CambiarPasswordPage from './pages/CambiarPasswordPage';
import InicioPage from './pages/InicioPage';
import UsuariosPage from './pages/UsuariosPage';

// Marca del cliente y módulos instalados en esta instancia
const ConfigContext = createContext(null);
export const useConfig = () => useContext(ConfigContext);

// Módulos instalados (backend) con interfaz disponible (frontend) a los que entra este usuario
// ¿Está instalado el módulo y este usuario entra? (p. ej. botón "Cobrar" solo si hay finanzas)
export function useModulo(clave) {
  return useConfig().modulos.some(m => m.clave === clave) && puedeEntrar(clave);
}

export const misModulos = (config) =>
  config.modulos.filter(m => MODULOS[m.clave] && puedeEntrar(m.clave)).map(m => ({ ...m, ...MODULOS[m.clave] }));

function NavItem({ to, end, children }) {
  return (
    <NavLink to={to} end={end}
             className={({ isActive }) => `text-sm px-3 py-1.5 rounded-lg whitespace-nowrap ${
               isActive ? 'bg-[var(--acento)] text-white font-medium' : 'text-zinc-600 hover:bg-zinc-100'}`}>
      {children}
    </NavLink>
  );
}

function Layout() {
  const config = useConfig();
  const navigate = useNavigate();
  const location = useLocation();
  // Al volver del login regresa a donde iba (p. ej. el QR de un punto de rondín)
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace state={{ de: location.pathname + location.search }} />;
  if (localStorage.getItem('debe_cambiar_password') === 'true') return <Navigate to="/cambiar-password" replace />;
  const modulos = misModulos(config);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-zinc-200 px-4 md:px-6 py-2 flex items-center gap-3 flex-wrap print:hidden">
        <NavLink to="/" className="font-bold mr-2" style={{ color: 'var(--acento)' }}>{config.nombre}</NavLink>
        <div className="flex gap-1 basis-full order-last overflow-x-auto md:basis-0 md:flex-1 md:order-none md:flex-wrap">
          <NavItem to="/" end>Inicio</NavItem>
          {modulos.map(m => m.menu.map(i => <NavItem key={i.to} to={i.to} end={i.end}>{i.label}</NavItem>))}
          {esAdmin() && <NavItem to="/usuarios">Usuarios</NavItem>}
        </div>
        <span className="text-xs text-zinc-500 ml-auto md:ml-0">{localStorage.getItem('nombre')}</span>
        <button onClick={() => { cerrarSesion(); navigate('/login'); }}
                className="text-xs border border-zinc-300 rounded px-2 py-1 hover:bg-zinc-100">Salir</button>
      </nav>

      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 flex-1">
        <Routes>
          <Route path="/" element={<InicioPage />} />
          {modulos.map(m => <Route key={m.clave} path={`/${m.clave}/*`} element={<m.Rutas />} />)}
          {esAdmin() && <Route path="/usuarios" element={<UsuariosPage />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="text-center text-[11px] text-zinc-400 py-3 print:hidden">
        Plataforma por <a href="https://havocdev.mx" target="_blank" rel="noreferrer" className="hover:underline">HAVOC</a>
      </footer>
    </div>
  );
}

export default function App() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/config').then(({ data }) => {
      document.documentElement.style.setProperty('--acento', data.color);
      document.title = data.nombre;
      setConfig(data);
    }).catch(() => setError(true));
  }, []);

  if (error) return <p className="p-8 text-center text-zinc-500">No se pudo conectar con el servidor.</p>;
  if (!config) return null;

  return (
    <ConfigContext.Provider value={config}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cambiar-password" element={<CambiarPasswordPage />} />
          <Route path="/*" element={<Layout />} />
        </Routes>
      </BrowserRouter>
    </ConfigContext.Provider>
  );
}
