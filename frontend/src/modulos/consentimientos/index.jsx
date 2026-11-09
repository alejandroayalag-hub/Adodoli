import { Routes, Route, Navigate } from 'react-router-dom';
import { FileSignature } from 'lucide-react';
import PlantillasPage from './PlantillasPage';

function Rutas() {
  return (
    <Routes>
      <Route index element={<PlantillasPage />} />
      <Route path="*" element={<Navigate to="/consentimientos" replace />} />
    </Routes>
  );
}

export default {
  descripcion: 'Consentimientos informados firmados en pantalla',
  Icono: FileSignature,
  menu: [{ to: '/consentimientos', label: 'Consentimientos' }],
  Rutas,
};
