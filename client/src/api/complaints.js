import api from './axios.js';

export const createComplaintRequest = (formData) => api.post('/complaints', formData);
export const listMyComplaintsRequest = (params) => api.get('/complaints/my', { params });
export const getComplaintRequest = (id) => api.get(`/complaints/${id}`);
export const getComplaintUpdatesRequest = (id) => api.get(`/complaints/${id}/updates`);
export const cancelComplaintRequest = (id) => api.delete(`/complaints/${id}`);
