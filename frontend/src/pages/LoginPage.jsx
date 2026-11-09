import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useConfig } from '../App';
import { guardarSesion } from '../sesion';
import { input, boton, Campo, errorDe } from '../ui';

export default function LoginPage() {
  const config = useConfig();
  const navigate = useNavigate();
  const de = useLocation().state?.de;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      guardarSesion(data);
      navigate(data.debe_cambiar_password ? '/cambiar-password' : de || '/');
    } catch (err) {
      setError(errorDe(err, 'No se pudo iniciar sesión'));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={entrar} className="bg-white rounded-2xl border border-zinc-200 p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--acento)' }}>{config.nombre}</h1>
        <Campo label="Correo">
          <input className={input} type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} />
        </Campo>
        <Campo label="Contraseña">
          <input className={input} type="password" required value={password} onChange={e => setPassword(e.target.value)} />
        </Campo>
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        <button disabled={cargando} className={`${boton} w-full py-2.5`}>{cargando ? 'Entrando…' : 'Iniciar sesión'}</button>
      </form>
    </div>
  );
}
