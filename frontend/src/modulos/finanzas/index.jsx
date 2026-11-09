import { Routes, Route, Navigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import FinanzasPage from './FinanzasPage';

function Rutas() {
  return (
    <Routes>
      <Route index element={<FinanzasPage />} />
      <Route path="*" element={<Navigate to="/finanzas" replace />} />
    </Routes>
  );
}

export default {
  descripcion: 'Cobros, gastos y balance del mes',
  Icono: Wallet,
  menu: [{ to: '/finanzas', label: 'Finanzas' }],
  Rutas,
};
