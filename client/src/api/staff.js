import api from './axios.js';

export const listAssignedRequest = (params) => api.get('/staff/complaints', { params });
export const staffStatsRequest = () => api.get('/staff/stats');
export const staffUpdateStatusRequest = (id, body) => api.put(`/staff/complaints/${id}/status`, body);
export const staffUploadEvidenceRequest = (id, formData) => api.post(`/staff/complaints/${id}/evidence`, formData);
