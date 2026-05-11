import axios from 'axios';

// Определяем базовый URL в зависимости от окружения
const API_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://ticket-backend-3zm6.onrender.com/api/tickets/'
  : 'http://localhost:8000/api/tickets/';

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 секунд таймаут для генерации билетов
});

// Перехватчик запросов - добавляет токен авторизации к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Перехватчик ответов - обработка ошибок авторизации
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Если токен истек или недействителен
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('teacher');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;