import axios from 'axios';

const api = axios.create({
    baseURL: 'https://localhost:7064/api', // Based on backend launchSettings
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
