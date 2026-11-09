import { useEffect, useState } from 'react';
import api from '../api/client';
import { useConfig } from '../App';
import { input, boton, botonSec, tarjeta, Campo, Modal, errorDe } from '../ui';

// Usuarios de la instancia: quién es admin y a qué módulos entra cada quien
export default function UsuariosPage() {
  const config = useConfig();
  const [usuarios, setUsuarios] = useState([]);
  const [editando, setEditando] = useState(null);
  const [temporal, setTemporal] = useState(null); // { email, password } recién generada
  const [error, setError] = useState('');

  const cargar = () => api.get('/usuarios').then(r => setUsuarios(r.data)).catch(e => setError(errorDe(e)));
  useEffect(() => { cargar(); }, []);
  const nombreModulo = (clave) => config.modulos.find(m => m.clave === clave)?.nombre || clave;

  async function restablecer(u) {
    if (!window.confirm(`¿Generar contraseña temporal nueva para ${u.nombre}?`)) return;
    try {
      const { data } = await api.post(`/usuarios/${u.id}/restablecer`);
      setTemporal({ email: u.email, password: data.password_temporal });
    } catch (e) { setError(errorDe(e)); }
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold flex-1">Usuarios</h1>
        <button className={boton} onClick={() => setEditando({})}>+ Nuevo usuario</button>
      </div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className={`${tarjeta} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr><th className="px-4 py-2">Nombre</th><th className="px-4 py-2">Correo</th><th className="px-4 py-2">Acceso</th><th /></tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className={`border-t border-zinc-100 ${u.activo ? '' : 'opacity-40'}`}>
                <td className="px-4 py-2 font-medium">{u.nombre}</td>
                <td className="px-4 py-2 text-zinc-500">{u.email}</td>
                <td className="px-4 py-2">
                  {u.rol === 'admin'
                    ? <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 text-white">Admin · todo</span>
                    : u.modulos.map(m => <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 mr-1">{nombreModulo(m)}</span>)}
                  {!u.activo && <span className="text-xs ml-1">(inactivo)</span>}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button className="text-xs text-zinc-500 hover:underline mr-3" onClick={() => restablecer(u)}>Contraseña</button>
                  <button className="text-xs hover:underline" style={{ color: 'var(--acento)' }} onClick={() => setEditando(u)}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <UsuarioModal usuario={editando} modulos={config.modulos} onClose={() => setEditando(null)}
                      onSave={(nuevo) => { setEditando(null); if (nuevo?.password_temporal) setTemporal({ email: nuevo.email, password: nuevo.password_temporal }); cargar(); }} />
      )}

      {temporal && (
        <Modal titulo="Contraseña temporal" onClose={() => setTemporal(null)}>
          <p className="text-sm mb-3">Pásasela a la persona. Se muestra <b>una sola vez</b>; al entrar tendrá que crear la suya.</p>
          <div className="bg-zinc-100 rounded-lg p-3 font-mono text-sm space-y-1">
            <div>{temporal.email}</div>
            <div className="text-lg">{temporal.password}</div>
          </div>
          <button className={`${boton} w-full mt-4`} onClick={() => setTemporal(null)}>Listo</button>
        </Modal>
      )}
    </div>
  );
}

function UsuarioModal({ usuario, modulos, onClose, onSave }) {
  const nuevo = !usuario.id;
  const [form, setForm] = useState({
    nombre: usuario.nombre || '', email: usuario.email || '', rol: usuario.rol || 'usuario',
    modulos: usuario.modulos || [], activo: usuario.activo ?? true,
  });
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const alternar = (clave) => set('modulos', form.modulos.includes(clave) ? form.modulos.filter(m => m !== clave) : [...form.modulos, clave]);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = nuevo
        ? await api.post('/usuarios', form)
        : await api.put(`/usuarios/${usuario.id}`, { nombre: form.nombre, rol: form.rol, modulos: form.modulos, activo: form.activo });
      onSave(data);
    } catch (err) { setError(errorDe(err, 'No se pudo guardar')); }
  }

  return (
    <Modal titulo={nuevo ? 'Nuevo usuario' : 'Editar usuario'} onClose={onClose}>
      <form onSubmit={guardar} className="space-y-3">
        <Campo label="Nombre *"><input className={input} required value={form.nombre} onChange={e => set('nombre', e.target.value)} /></Campo>
        <Campo label="Correo *">
          <input className={input} type="email" required disabled={!nuevo} value={form.email} onChange={e => set('email', e.target.value)} />
        </Campo>
        <Campo label="Rol">
          <select className={input} value={form.rol} onChange={e => set('rol', e.target.value)}>
            <option value="usuario">Usuario — solo los módulos que marques</option>
            <option value="admin">Administrador — todo, incluidos costos y reportes</option>
          </select>
        </Campo>
        {form.rol === 'usuario' && (
          <fieldset>
            <legend className="text-xs font-medium text-zinc-500 mb-1">Módulos</legend>
            {modulos.map(m => (
              <label key={m.clave} className="flex items-center gap-2 text-sm py-0.5">
                <input type="checkbox" checked={form.modulos.includes(m.clave)} onChange={() => alternar(m.clave)} /> {m.nombre}
              </label>
            ))}
          </fieldset>
        )}
        {!nuevo && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} /> Activo (puede entrar)
          </label>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button className={`${boton} flex-1`}>Guardar</button>
          <button type="button" className={botonSec} onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </Modal>
  );
}
