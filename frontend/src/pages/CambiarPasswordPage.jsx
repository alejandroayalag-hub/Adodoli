import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { input, boton, Campo, errorDe } from '../ui';

export default function CambiarPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');

  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />;

  async function guardar(e) {
    e.preventDefault();
    if (password !== confirmar) return setError('Las contraseñas no coinciden');
    try {
      await api.put('/auth/cambiar-password', { password });
      localStorage.removeItem('debe_cambiar_password');
      navigate('/');
    } catch (err) {
      setError(errorDe(err));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={guardar} className="bg-white rounded-2xl border border-zinc-200 p-8 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold">Crea tu contraseña</h1>
        <p className="text-sm text-zinc-500">Mínimo 8 caracteres. La temporal ya no servirá.</p>
        <Campo label="Nueva contraseña">
          <input className={input} type="password" minLength={8} required autoFocus value={password} onChange={e => setPassword(e.target.value)} />
        </Campo>
        <Campo label="Confírmala">
          <input className={input} type="password" minLength={8} required value={confirmar} onChange={e => setConfirmar(e.target.value)} />
        </Campo>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className={`${boton} w-full`}>Guardar</button>
      </form>
    </div>
  );
}
