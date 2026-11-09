import { Routes, Route, Navigate } from 'react-router-dom';
import { HardDriveDownload } from 'lucide-react';
import RespaldosPage from './RespaldosPage';

function Rutas() {
  return (
    <Routes>
      <Route index element={<RespaldosPage />} />
      <Route path="*" element={<Navigate to="/respaldos" replace />} />
    </Routes>
  );
}

export default {
  descripcion: 'Copias de seguridad de toda la información',
  Icono: HardDriveDownload,
  menu: [{ to: '/respaldos', label: 'Respaldos' }],
  Rutas,
};
