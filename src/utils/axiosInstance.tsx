import axios from 'axios'
import { clearToken } from './tokenManager'

const apiAdminInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL
  // baseURL: 'https://upleex.com/api/api/v1/',
  // headers: {
  //   'Content-Type': 'multipart/form-data'
  // }
})

export const api = apiAdminInstance;

apiAdminInstance.interceptors.request.use(
  async config => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['ngrok-skip-browser-warning'] = 'true'
    return config;
  },
  error => Promise.reject(error)
);

apiAdminInstance.interceptors.response.use(
  function (response) {
    return response;
  },
  error => {
    const { response } = error;

    if (response?.status === 401) {
      // optional: avoid infinite redirect
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        clearToken();
        localStorage.clear();
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);
