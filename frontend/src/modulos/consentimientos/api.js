import api from '../../api/client';

const d = (p) => p.then(r => r.data);
export const getConsultorio     = () => d(api.get('/consentimientos/consultorio'));
export const guardarConsultorio = (data) => d(api.put('/consentimientos/consultorio', data));
export const getPlantillas      = () => d(api.get('/consentimientos/plantillas'));
export const crearPlantilla     = (data) => d(api.post('/consentimientos/plantillas', data));
export const editarPlantilla    = (id, data) => d(api.put(`/consentimientos/plantillas/${id}`, data));
export const getDePaciente      = (id) => d(api.get(`/consentimientos/pacientes/${id}`));
export const firmar             = (id, data) => d(api.post(`/consentimientos/pacientes/${id}`, data));
export const anular             = (id) => d(api.delete(`/consentimientos/firmados/${id}`));
