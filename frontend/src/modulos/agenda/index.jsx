import { Routes, Route, Navigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import AgendaPage from './AgendaPage';

function Rutas() {
  return (
    <Routes>
      <Route index element={<AgendaPage />} />
      <Route path="*" element={<Navigate to="/agenda" replace />} />
    </Routes>
  );
}

export default {
  descripcion: 'Citas de la semana por paciente',
  Icono: CalendarDays,
  menu: [{ to: '/agenda', label: 'Agenda' }],
  Rutas,
};
