import axios, { AxiosError } from "axios";
import { authService } from "./authService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const url = originalRequest?.url ?? '';
    // Don't attempt refresh for auth endpoints to avoid loops.
    if (url.includes('/Auth/refresh') || url.includes('/Auth/login') || url.includes('/Auth/logout')) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401 || !originalRequest || (originalRequest as { _retry?: boolean })._retry) {
      return Promise.reject(error);
    }
    (originalRequest as { _retry?: boolean })._retry = true;
    if (!refreshPromise) {
      refreshPromise = authService.refreshAccessToken();
    }
    const newToken = await refreshPromise;
    refreshPromise = null;
    if (newToken) {
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    }
    authService.logout();
    window.location.href = '/';
    return Promise.reject(error);
  },
);

export default api;
