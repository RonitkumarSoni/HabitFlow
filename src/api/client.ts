import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

export const TOKEN_KEY = 'habitflow_auth_token';

// Read API URL from environment variable
// In Expo, EXPO_PUBLIC_* variables are exposed to client bundle
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://habitflow-backend.onrender.com/api';

console.log('📡 HabitFlow API Base URL:', API_URL);

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Callback registered by AuthContext to handle auto-logout on 401
let onUnauthorizedCallback: (() => void) | null = null;

export function registerUnauthorizedHandler(callback: () => void) {
  onUnauthorizedCallback = callback;
}

// Request interceptor: Attach JWT Bearer token & client timezone
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Send client timezone to backend
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      config.headers['x-timezone'] = tz;
    } catch (e) {
      console.warn('Error reading auth token from SecureStore:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Global error handler & 401 auto-logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; errors?: any[] }>) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ 401 Unauthorized encountered. Clearing token & redirecting to login.');
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch {}
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    // Enhance error message for mobile UI
    const customMessage =
      error.response?.data?.message ||
      (error.message === 'Network Error'
        ? 'Cannot reach the server. Please check your internet connection.'
        : error.message || 'An unexpected error occurred');

    return Promise.reject(new Error(customMessage));
  }
);

