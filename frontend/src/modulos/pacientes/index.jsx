import { Routes, Route, Navigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import PacientesPage from './PacientesPage';
import PacientePage from './PacientePage';

function Rutas() {
  return (
    <Routes>
      <Route index element={<PacientesPage />} />
      <Route path=":id" element={<PacientePage />} />
      <Route path="*" element={<Navigate to="/pacientes" replace />} />
    </Routes>
  );
}

export default {
  descripcion: 'Expediente de pacientes con historia clínica',
  Icono: Users,
  menu: [{ to: '/pacientes', label: 'Pacientes' }],
  Rutas,
};
