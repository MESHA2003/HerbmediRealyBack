import axios from 'axios';

// Use Vite proxy in dev (empty prefix = same origin), or env variable for production
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const API = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: add JWT token to every request
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: automatically refresh token on 401 (Unauthorized)
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refresh = localStorage.getItem('refresh_token');
            if (refresh) {
                try {
                    const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
                    localStorage.setItem('access_token', data.access);
                    originalRequest.headers.Authorization = `Bearer ${data.access}`;
                    return API(originalRequest);
                } catch (err) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
            } else {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default API;