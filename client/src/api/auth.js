import api from './axios.js';

export const registerRequest = (payload) => api.post('/auth/register', payload);
export const loginRequest = (payload) => api.post('/auth/login', payload);
export const meRequest = () => api.get('/auth/me');
export const logoutRequest = () => api.post('/auth/logout');
