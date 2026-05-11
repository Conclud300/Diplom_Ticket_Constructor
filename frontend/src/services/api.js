import axios from 'axios';

// ВАЖНО: замените URL на ваш реальный бэкенд!
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ticket-backend-3zm6.onrender.com'  // ← ВАШ РЕАЛЬНЫЙ URL
  : 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/tickets/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;