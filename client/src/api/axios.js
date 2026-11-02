import axios from 'axios';

const TOKEN_KEY = 'civictrack_token';

// Session-only storage (cleared when the tab closes); the token also expires after 1 hour.
export const getAuthToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setAuthToken = (token) => {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: the HttpOnly cookie is still used */
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // send the HttpOnly auth cookie when the browser allows it
  headers: { 'X-Requested-With': 'XMLHttpRequest' }, // required by the API's CSRF check
});

// Fallback for browsers that block cross-site cookies: send the token in a header.
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;