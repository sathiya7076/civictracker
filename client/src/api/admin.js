import api from './axios.js';

export const adminDashboardRequest = () => api.get('/admin/dashboard');
export const adminComplaintsRequest = (params) => api.get('/admin/complaints', { params });
export const assignRequest = (id, body) => api.put(`/admin/complaints/${id}/assign`, body);
export const priorityRequest = (id, body) => api.put(`/admin/complaints/${id}/priority`, body);
export const verifyRequest = (id, body) => api.put(`/admin/complaints/${id}/verify`, body);
export const rejectRequest = (id, body) => api.put(`/admin/complaints/${id}/reject`, body);
export const listUsersRequest = (params) => api.get('/admin/users', { params });
export const createStaffRequest = (body) => api.post('/admin/staff', body);
export const setUserStatusRequest = (id, body) => api.put(`/admin/users/${id}/status`, body);
