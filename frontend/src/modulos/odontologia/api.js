import api from '../../api/client';

const d = (p) => p.then(r => r.data);
export const getDePaciente   = (id) => d(api.get(`/odontologia/pacientes/${id}`));
export const guardarHistoria = (id, datos) => d(api.put(`/odontologia/pacientes/${id}/historia`, datos));
export const crearHoja       = (data) => d(api.post('/odontologia/endodoncias', data));
export const editarHoja      = (id, data) => d(api.put(`/odontologia/endodoncias/${id}`, data));
export const borrarHoja      = (id) => d(api.delete(`/odontologia/endodoncias/${id}`));
export const abonar          = (id, data) => d(api.post(`/odontologia/endodoncias/${id}/abonos`, data));
