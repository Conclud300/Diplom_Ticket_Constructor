import axios from 'axios';

// ОПРЕДЕЛЯЕМ URL В ЗАВИСИМОСТИ ОТ ТОГО, ГДЕ ЗАПУЩЕНО ПРИЛОЖЕНИЕ
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction 
  ? 'https://ticket-backend-3zm6.onrender.com/api/tickets/'
  : 'http://localhost:8000/api/tickets/';

console.log('API URL:', API_BASE_URL);  // Убедимся, что URL правильный

const api = axios.create({
  baseURL: API_BASE_URL,
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
    console.log('Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;