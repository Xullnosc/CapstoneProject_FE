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
let authFailureLock = false;
let redirectingToLogin = false;

api.interceptors.request.use(
  (config) => {
    // If we've already determined auth is invalid (e.g., single-session invalidated),
    // stop sending authenticated requests to avoid request storms.
    if (authFailureLock) {
      return Promise.reject(new Error("Auth invalidated; request cancelled."));
    }
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
    // Redirect forbidden requests to Access Denied page (avoid loops).
    if (error.response?.status === 403) {
      if (!window.location.pathname.startsWith('/access-denied')) {
        window.location.href = '/access-denied';
      }
      return Promise.reject(error);
    }
    // Don't attempt refresh for auth endpoints to avoid loops.
    if (url.includes('/Auth/refresh') || url.includes('/Auth/login') || url.includes('/Auth/logout')) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401 || !originalRequest || (originalRequest as { _retry?: boolean })._retry) {
      return Promise.reject(error);
    }
    if (authFailureLock) {
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
    // Refresh failed: lock auth and redirect once to avoid retry storms
    authFailureLock = true;
    try {
      await authService.logout();
    } finally {
      if (!redirectingToLogin) {
        redirectingToLogin = true;
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
