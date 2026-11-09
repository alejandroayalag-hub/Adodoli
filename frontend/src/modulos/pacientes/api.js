import api from '../../api/client';

const d = (p) => p.then(r => r.data);
export const getPacientes     = (q) => d(api.get('/pacientes', { params: { q } }));
export const getPaciente      = (id) => d(api.get(`/pacientes/${id}`));
export const crearPaciente    = (data) => d(api.post('/pacientes', data));
export const editarPaciente   = (id, data) => d(api.put(`/pacientes/${id}`, data));
export const borrarPaciente   = (id) => d(api.delete(`/pacientes/${id}`));
export const guardarAntecedentes = (id, datos) => d(api.put(`/pacientes/${id}/antecedentes`, datos));
