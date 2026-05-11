import axios from 'axios';

// Используем переменную окружения или прямой URL
const API_URL = process.env.REACT_APP_API_URL || 'https://ticket-backend-3zm6.onrender.com/api/tickets/';

console.log('API URL:', API_URL);  // Для проверки

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    console.log('Request:', config.method, config.url);  // Для проверки
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;