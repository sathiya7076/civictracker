import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // send the HttpOnly auth cookie
  headers: { 'X-Requested-With': 'XMLHttpRequest' }, // required by the API's CSRF check
});

export default api;
