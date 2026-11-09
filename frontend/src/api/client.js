import axios from 'axios';
import { cerrarSesion } from '../sesion';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // 401 fuera del login = sesión vencida o usuario desactivado
    if (err.response?.status === 401 && !err.config.url.startsWith('/auth/')) {
      cerrarSesion();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
