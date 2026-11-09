import api from '../../api/client';

const d = (p) => p.then(r => r.data);
export const getMes          = (mes) => d(api.get('/finanzas/movimientos', { params: { mes } }));
export const getDePaciente   = (paciente_id) => d(api.get('/finanzas/movimientos', { params: { paciente_id } }));
export const getCategorias   = () => d(api.get('/finanzas/categorias'));
export const crearMovimiento = (data) => d(api.post('/finanzas/movimientos', data));
export const editarMovimiento = (id, data) => d(api.put(`/finanzas/movimientos/${id}`, data));
export const borrarMovimiento = (id) => d(api.delete(`/finanzas/movimientos/${id}`));
