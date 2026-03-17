import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

// Cloudflare Tunnel к бэкенду (localhost:3002)
export const BASE_URL = 'https://procedures-state-categories-pdt.trycloudflare.com';
const $api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Важно для отправки cookies
  timeout: 30000, // 30 seconds timeout
});

$api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

$api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Если ошибка 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Пытаемся обновить токен
        const refreshApi = axios.create({
          baseURL: BASE_URL,
          withCredentials: true,
          timeout: 10000,
        });

        const response = await refreshApi.post('/auth/refresh');

        if (response.data.accessToken) {
          // Сохраняем новый access token
          await AsyncStorage.setItem('accessToken', response.data.accessToken);

          // Обновляем заголовок и повторяем запрос
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;

          return $api(originalRequest);
        }
      } catch (refreshError) {
        // Если не удалось обновить токен - очищаем данные и выбрасываем ошибку сессии
        await AsyncStorage.multiRemove(['accessToken', 'userRole', 'userEmail', 'userId']);

        const sessionExpiredError = new Error('SESSION_EXPIRED');

        sessionExpiredError.name = 'SESSION_EXPIRED';

        return Promise.reject(sessionExpiredError);
      }
    }

    return Promise.reject(error);
  }
);

export default $api;
