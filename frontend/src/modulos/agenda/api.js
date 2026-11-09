import api from '../../api/client';

const d = (p) => p.then(r => r.data);
export const getCitas      = (desde, hasta) => d(api.get('/agenda/citas', { params: { desde, hasta } }));
export const getDePaciente = (paciente_id) => d(api.get('/agenda/citas', { params: { paciente_id } }));
export const crearCita     = (data) => d(api.post('/agenda/citas', data));
export const editarCita    = (id, data) => d(api.put(`/agenda/citas/${id}`, data));
export const borrarCita    = (id) => d(api.delete(`/agenda/citas/${id}`));
