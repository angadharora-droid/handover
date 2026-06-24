import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const TOKEN_KEY = 'hg_token';
export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If a token expires or is rejected mid-session, drop it and bounce to login.
// The guard avoids a redirect loop while already on the login screen (e.g. a
// failed login attempt also returns 401).
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  }
);

export function apiError(err, fallback = 'Something went wrong') {
  return err?.response?.data?.error || err?.message || fallback;
}
