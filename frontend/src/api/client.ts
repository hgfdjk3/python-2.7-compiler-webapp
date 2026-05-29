import axios from 'axios';
import { useUserStore } from '../store/userStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const username = useUserStore.getState().user?.username;
    if (username) {
      config.headers['x-username'] = username;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
