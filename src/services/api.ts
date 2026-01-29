import axios from "axios";

const api = axios.create({
    baseURL: 'https://localhost:7064/api', // Based on backend launchSettings
    headers: {
        'Content-Type': 'application/json',
    },
});

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL, // Based on backend launchSettings
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
